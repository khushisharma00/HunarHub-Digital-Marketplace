const db = require('../config/db');

// Create a new service request with strict CONCURRENCY / DOUBLE-BOOKING PREVENTION
exports.createRequest = async (req, res, next) => {
  try {
    const { service_id, booking_date, time_slot, address, notes, payment_method, payment_details } = req.body;
    const customer_id = req.user.id;

    if (!service_id || !booking_date || !time_slot || !address) {
      return res.status(400).json({
        success: false,
        message: 'Service, booking date, time slot, and service address are required'
      });
    }

    // Verify service exists and is active
    const service = await db('services')
      .where({ id: service_id, is_active: true })
      .first();

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found or unavailable' });
    }

    const entrepreneur = await db('entrepreneurs')
      .where({ id: service.entrepreneur_id, status: 'approved' })
      .first();

    if (!entrepreneur) {
      return res.status(400).json({ success: false, message: 'Entrepreneur is not available' });
    }

    if (entrepreneur.user_id === customer_id) {
      return res.status(400).json({ success: false, message: 'You cannot book your own service' });
    }

    let createdRequest;

    // Concurrency-safe atomic transaction
    await db.transaction(async (trx) => {
      // Check for concurrent booking on this exact date and slot for this entrepreneur
      const existing = await trx('service_requests')
        .where({
          entrepreneur_id: service.entrepreneur_id,
          booking_date,
          time_slot
        })
        .whereNotIn('status', ['Rejected', 'Cancelled'])
        .first();

      if (existing) {
        const error = new Error('This time slot is already booked for the selected date. Please choose another slot.');
        error.code = 'SLOT_ALREADY_BOOKED';
        throw error;
      }

      // Determine Payment Method and Status (Card, UPI, or COD/Completion)
      let finalPaymentMethod = 'Pay on service completion (COD)';
      let finalPaymentStatus = 'Pending';
      const requestedMethod = String(payment_method || 'COD').toUpperCase();

      if (requestedMethod.includes('UPI')) {
        const upiId = payment_details?.upi_id ? payment_details.upi_id.trim() : 'Instant QR / App';
        finalPaymentMethod = `UPI (${upiId})`;
        finalPaymentStatus = 'Paid';
      } else if (requestedMethod.includes('CARD')) {
        let cardLast4 = '••••';
        if (payment_details?.card_number) {
          const cleanNum = payment_details.card_number.replace(/\D/g, '');
          cardLast4 = cleanNum.slice(-4) || '••••';
        }
        const cardBrand = payment_details?.card_brand || 'Card';
        finalPaymentMethod = `${cardBrand} ending in ${cardLast4}`;
        finalPaymentStatus = 'Paid';
      } else {
        finalPaymentMethod = 'Pay on service completion (COD)';
        finalPaymentStatus = 'Pending';
      }

      // Insert service request
      const [requestId] = await trx('service_requests').insert({
        customer_id,
        entrepreneur_id: service.entrepreneur_id,
        service_id,
        booking_date,
        time_slot,
        address: address.trim(),
        notes: notes ? notes.trim() : null,
        total_price: service.price,
        status: 'Pending',
        payment_method: finalPaymentMethod,
        payment_status: finalPaymentStatus
      });

      // Record status history
      await trx('status_history').insert({
        entity_type: 'service_request',
        entity_id: requestId,
        previous_status: null,
        new_status: 'Pending',
        changed_by_user_id: customer_id,
        notes: `Service request placed by customer via ${finalPaymentMethod} [Payment: ${finalPaymentStatus}]`
      });

      // Notify Entrepreneur
      await trx('notifications').insert({
        user_id: entrepreneur.user_id,
        title: 'New Service Request!',
        message: `You have received a new booking request for "${service.title}" on ${booking_date} (${time_slot}).`,
        type: 'request_status',
        link: '/entrepreneur/dashboard'
      });

      createdRequest = await trx('service_requests')
        .join('services', 'service_requests.service_id', 'services.id')
        .where('service_requests.id', requestId)
        .select('service_requests.*', 'services.title as service_title')
        .first();
    });

    return res.status(201).json({
      success: true,
      message: 'Service request placed successfully. The entrepreneur will review and accept your request.',
      request: createdRequest
    });
  } catch (error) {
    if (error.code === 'SLOT_ALREADY_BOOKED') {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Get requests for current customer or entrepreneur
exports.getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = db('service_requests')
      .join('services', 'service_requests.service_id', 'services.id')
      .join('entrepreneurs', 'service_requests.entrepreneur_id', 'entrepreneurs.id')
      .join('users as customers', 'service_requests.customer_id', 'customers.id')
      .leftJoin('reviews', 'service_requests.id', 'reviews.service_request_id');

    if (req.user.role === 'customer') {
      query = query.where('service_requests.customer_id', req.user.id);
    } else if (req.user.role === 'entrepreneur') {
      const ent = await db('entrepreneurs').where({ user_id: req.user.id }).first();
      if (!ent) return res.status(404).json({ success: false, message: 'Entrepreneur profile not found' });
      query = query.where('service_requests.entrepreneur_id', ent.id);
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (status && status !== 'all') {
      query = query.where('service_requests.status', status);
    }

    const requests = await query
      .select(
        'service_requests.*',
        'services.title as service_title',
        'services.duration_mins',
        'entrepreneurs.business_name as entrepreneur_name',
        'entrepreneurs.city as entrepreneur_city',
        'entrepreneurs.area as entrepreneur_area',
        'entrepreneurs.profile_photo as entrepreneur_photo',
        'customers.full_name as customer_name',
        'customers.email as customer_email',
        'customers.phone as customer_phone',
        'reviews.id as review_id',
        'reviews.rating as review_rating'
      )
      .orderBy('service_requests.created_at', 'desc');

    return res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// Update request status (Accepted, Rejected, In progress, Completed, Cancelled, Disputed)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Pending', 'Accepted', 'Rejected', 'In progress', 'Completed', 'Cancelled', 'Disputed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const request = await db('service_requests').where({ id }).first();
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    const entrepreneur = await db('entrepreneurs').where({ id: request.entrepreneur_id }).first();

    // Permissions check
    const isCustomer = req.user.id === request.customer_id;
    const isEntrepreneur = entrepreneur && req.user.id === entrepreneur.user_id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isEntrepreneur && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this request' });
    }

    // Role-specific status transitions
    if (isCustomer && !isAdmin) {
      if (status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Customers can only cancel a request' });
      }
      if (request.status === 'Completed' || request.status === 'In progress') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a request that is already in progress or completed' });
      }
    }

    if (isEntrepreneur && !isAdmin) {
      const allowedForEntrepreneur = ['Accepted', 'Rejected', 'In progress', 'Completed'];
      if (!allowedForEntrepreneur.includes(status)) {
        return res.status(403).json({ success: false, message: 'Invalid status transition for entrepreneur' });
      }
    }

    await db.transaction(async (trx) => {
      const previousStatus = request.status;
      const updates = {
        status,
        updated_at: db.fn.now()
      };

      if (status === 'Completed') {
        updates.payment_status = 'Paid';
      }

      await trx('service_requests').where({ id }).update(updates);

      // Status history tracking
      await trx('status_history').insert({
        entity_type: 'service_request',
        entity_id: id,
        previous_status: previousStatus,
        new_status: status,
        changed_by_user_id: req.user.id,
        notes: notes || `Status changed from ${previousStatus} to ${status}`
      });

      // Send notification to the opposite party
      const targetUserId = isCustomer ? entrepreneur.user_id : request.customer_id;
      await trx('notifications').insert({
        user_id: targetUserId,
        title: `Service Request ${status}`,
        message: `Service request #${id} has been marked as "${status}".`,
        type: 'request_status',
        link: isCustomer ? '/entrepreneur/dashboard' : '/dashboard'
      });
    });

    const updated = await db('service_requests').where({ id }).first();
    return res.json({
      success: true,
      message: `Request status updated to ${status}`,
      request: updated
    });
  } catch (error) {
    next(error);
  }
};

// Get status history for service request
exports.getRequestHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await db('status_history')
      .leftJoin('users', 'status_history.changed_by_user_id', 'users.id')
      .where({ entity_type: 'service_request', entity_id: id })
      .select('status_history.*', 'users.full_name as changed_by_name')
      .orderBy('status_history.created_at', 'asc');

    return res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
};
