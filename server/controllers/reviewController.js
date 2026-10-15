const db = require('../config/db');

// Submit a review for a COMPLETED service request or order
exports.createReview = async (req, res, next) => {
  try {
    const { service_request_id, order_id, rating, comment } = req.body;
    const customer_id = req.user.id;

    const numRating = parseInt(rating, 10);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    if (!service_request_id && !order_id) {
      return res.status(400).json({ success: false, message: 'Must specify either a service_request_id or order_id to review.' });
    }

    let entrepreneur_id = null;

    // Check service request review rules
    if (service_request_id) {
      const sRequest = await db('service_requests').where({ id: service_request_id }).first();
      if (!sRequest) {
        return res.status(404).json({ success: false, message: 'Service request not found.' });
      }

      if (sRequest.customer_id !== customer_id) {
        return res.status(403).json({ success: false, message: 'Only the customer who placed this service request can review it.' });
      }

      if (sRequest.status !== 'Completed') {
        return res.status(400).json({ success: false, message: 'Reviews are only allowed after a service request is Completed.' });
      }

      const existingReview = await db('reviews').where({ service_request_id }).first();
      if (existingReview) {
        return res.status(409).json({ success: false, message: 'You have already reviewed this service request.' });
      }

      entrepreneur_id = sRequest.entrepreneur_id;
    }

    // Check order review rules
    if (order_id) {
      const order = await db('orders').where({ id: order_id }).first();
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      if (order.customer_id !== customer_id) {
        return res.status(403).json({ success: false, message: 'Only the customer who placed this order can review it.' });
      }

      if (order.status !== 'Completed') {
        return res.status(400).json({ success: false, message: 'Reviews are only allowed after an order is Completed.' });
      }

      const existingReview = await db('reviews').where({ order_id }).first();
      if (existingReview) {
        return res.status(409).json({ success: false, message: 'You have already reviewed this order.' });
      }

      // Find the primary entrepreneur of this order
      const firstItem = await db('order_items').where({ order_id }).first();
      if (firstItem) {
        entrepreneur_id = firstItem.entrepreneur_id;
      }
    }

    if (!entrepreneur_id) {
      return res.status(400).json({ success: false, message: 'Unable to associate review with an entrepreneur.' });
    }

    let review;

    await db.transaction(async (trx) => {
      const [reviewId] = await trx('reviews').insert({
        customer_id,
        entrepreneur_id,
        service_request_id: service_request_id || null,
        order_id: order_id || null,
        rating: numRating,
        comment: comment ? comment.trim() : null
      });

      // Recalculate average rating & count for this entrepreneur
      const agg = await trx('reviews')
        .where({ entrepreneur_id })
        .avg('rating as avg_rating')
        .count('* as total_reviews')
        .first();

      const newAvg = agg.avg_rating ? parseFloat(Number(agg.avg_rating).toFixed(1)) : 0;
      const newCount = Number(agg.total_reviews) || 0;

      await trx('entrepreneurs').where({ id: entrepreneur_id }).update({
        rating_avg: newAvg,
        rating_count: newCount
      });

      // Notify entrepreneur of new review
      const ent = await trx('entrepreneurs').where({ id: entrepreneur_id }).first();
      if (ent) {
        await trx('notifications').insert({
          user_id: ent.user_id,
          title: 'New Customer Feedback!',
          message: `A customer rated you ${numRating} stars: "${comment ? comment.slice(0, 80) : 'Great work!'}"`,
          type: 'review',
          link: '/entrepreneur/dashboard'
        });
      }

      review = await trx('reviews').where({ id: reviewId }).first();
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      review
    });
  } catch (error) {
    next(error);
  }
};
