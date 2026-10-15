const db = require('../config/db');

// Raise a dispute (Customer or Entrepreneur)
exports.raiseDispute = async (req, res, next) => {
  try {
    const { service_request_id, order_id, reason, details } = req.body;
    const raised_by_user_id = req.user.id;

    if (!reason || !details) {
      return res.status(400).json({ success: false, message: 'Dispute reason and detailed explanation are required.' });
    }

    if (!service_request_id && !order_id) {
      return res.status(400).json({ success: false, message: 'Please specify either a service request or order for the dispute.' });
    }

    let against_user_id = null;

    if (service_request_id) {
      const sRequest = await db('service_requests').where({ id: service_request_id }).first();
      if (!sRequest) return res.status(404).json({ success: false, message: 'Service request not found' });

      const ent = await db('entrepreneurs').where({ id: sRequest.entrepreneur_id }).first();
      if (raised_by_user_id === sRequest.customer_id) {
        against_user_id = ent.user_id;
      } else if (ent && raised_by_user_id === ent.user_id) {
        against_user_id = sRequest.customer_id;
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You are not a party to this service request' });
      }

      // Mark request status as Disputed
      await db('service_requests').where({ id: service_request_id }).update({ status: 'Disputed' });
      await db('status_history').insert({
        entity_type: 'service_request',
        entity_id: service_request_id,
        previous_status: sRequest.status,
        new_status: 'Disputed',
        changed_by_user_id: raised_by_user_id,
        notes: `Dispute raised: ${reason}`
      });
    }

    if (order_id) {
      const order = await db('orders').where({ id: order_id }).first();
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const firstItem = await db('order_items').where({ order_id }).first();
      const ent = firstItem ? await db('entrepreneurs').where({ id: firstItem.entrepreneur_id }).first() : null;

      if (raised_by_user_id === order.customer_id) {
        against_user_id = ent ? ent.user_id : null;
      } else if (ent && raised_by_user_id === ent.user_id) {
        against_user_id = order.customer_id;
      } else if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You are not a party to this order' });
      }
    }

    const [disputeId] = await db('disputes').insert({
      raised_by_user_id,
      against_user_id,
      service_request_id: service_request_id || null,
      order_id: order_id || null,
      reason: reason.trim(),
      details: details.trim(),
      status: 'Open'
    });

    // Notify admins about new dispute
    const admins = await db('users').where({ role: 'admin' });
    for (const admin of admins) {
      await db('notifications').insert({
        user_id: admin.id,
        title: 'New Dispute Raised',
        message: `Dispute #${disputeId} has been raised regarding ${service_request_id ? 'Service Request #' + service_request_id : 'Order #' + order_id}: "${reason}"`,
        type: 'dispute',
        link: '/admin/dashboard'
      });
    }

    const createdDispute = await db('disputes').where({ id: disputeId }).first();
    return res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully. Our admin team will investigate and issue a resolution.',
      dispute: createdDispute
    });
  } catch (error) {
    next(error);
  }
};

// Get disputes (User sees their own, Admin sees all)
exports.getDisputes = async (req, res, next) => {
  try {
    let query = db('disputes')
      .join('users as raiser', 'disputes.raised_by_user_id', 'raiser.id')
      .leftJoin('users as against', 'disputes.against_user_id', 'against.id');

    if (req.user.role !== 'admin') {
      query = query.where(function () {
        this.where('disputes.raised_by_user_id', req.user.id)
          .orWhere('disputes.against_user_id', req.user.id);
      });
    }

    const disputes = await query
      .select(
        'disputes.*',
        'raiser.full_name as raised_by_name',
        'raiser.email as raised_by_email',
        'against.full_name as against_name',
        'against.email as against_email'
      )
      .orderBy('disputes.created_at', 'desc');

    return res.json({ success: true, disputes });
  } catch (error) {
    next(error);
  }
};

// Admin resolve dispute
exports.resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_decision, status = 'Resolved' } = req.body;

    if (!admin_decision) {
      return res.status(400).json({ success: false, message: 'Please provide an admin resolution decision.' });
    }

    const dispute = await db('disputes').where({ id }).first();
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    await db.transaction(async (trx) => {
      await trx('disputes').where({ id }).update({
        admin_decision: admin_decision.trim(),
        status,
        resolved_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });

      // Notify raiser
      await trx('notifications').insert({
        user_id: dispute.raised_by_user_id,
        title: `Dispute #${id} Resolved`,
        message: `Admin decision: ${admin_decision}`,
        type: 'dispute',
        link: '/dashboard'
      });

      // Notify against party if any
      if (dispute.against_user_id) {
        await trx('notifications').insert({
          user_id: dispute.against_user_id,
          title: `Dispute #${id} Resolved`,
          message: `Admin decision: ${admin_decision}`,
          type: 'dispute',
          link: '/dashboard'
        });
      }
    });

    const updated = await db('disputes').where({ id }).first();
    return res.json({ success: true, message: 'Dispute marked as resolved', dispute: updated });
  } catch (error) {
    next(error);
  }
};
