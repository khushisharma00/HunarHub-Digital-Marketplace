const db = require('../config/db');

// Admin Analytics and KPI calculation
exports.getAnalytics = async (req, res, next) => {
  try {
    // 1. Registered Entrepreneurs (total and by status)
    const totalEntrepreneursRow = await db('entrepreneurs').count('* as count').first();
    const totalEntrepreneurs = Number(totalEntrepreneursRow.count) || 0;

    const pendingEntrepreneursRow = await db('entrepreneurs').where({ status: 'pending' }).count('* as count').first();
    const pendingEntrepreneurs = Number(pendingEntrepreneursRow.count) || 0;

    const approvedEntrepreneursRow = await db('entrepreneurs').where({ status: 'approved' }).count('* as count').first();
    const approvedEntrepreneurs = Number(approvedEntrepreneursRow.count) || 0;

    // 2. Active Users (total customers + entrepreneurs)
    const totalUsersRow = await db('users').count('* as count').first();
    const totalUsers = Number(totalUsersRow.count) || 0;

    const customersCountRow = await db('users').where({ role: 'customer' }).count('* as count').first();
    const totalCustomers = Number(customersCountRow.count) || 0;

    // 3. Service Requests & Conversion Rate
    const totalRequestsRow = await db('service_requests').count('* as count').first();
    const totalRequests = Number(totalRequestsRow.count) || 0;

    const completedRequestsRow = await db('service_requests').where({ status: 'Completed' }).count('* as count').first();
    const completedRequests = Number(completedRequestsRow.count) || 0;

    const conversionRate = totalRequests > 0 ? ((completedRequests / totalRequests) * 100).toFixed(1) : '0.0';

    // 4. Product Sales Volume & Revenue
    const completedOrdersQuery = db('orders').where({ status: 'Completed' });
    const completedOrdersRow = await completedOrdersQuery.count('* as count').sum('total_amount as revenue').first();
    const completedOrdersCount = Number(completedOrdersRow.count) || 0;
    const totalProductRevenue = Number(completedOrdersRow.revenue) || 0;

    const itemsSoldRow = await db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('orders.status', 'Completed')
      .sum('order_items.quantity as units')
      .first();
    const totalUnitsSold = Number(itemsSoldRow.units) || 0;

    // Service revenue
    const completedServiceRevenueRow = await db('service_requests')
      .where({ status: 'Completed' })
      .sum('total_price as revenue')
      .first();
    const totalServiceRevenue = Number(completedServiceRevenueRow.revenue) || 0;

    const totalPlatformRevenue = totalProductRevenue + totalServiceRevenue;

    // 5. Average Entrepreneur Earnings
    const avgEarnings = approvedEntrepreneurs > 0 ? (totalPlatformRevenue / approvedEntrepreneurs).toFixed(2) : '0.00';

    // 6. Customer Satisfaction Ratings
    const avgRatingRow = await db('reviews').avg('rating as avg_rating').count('* as count').first();
    const avgSatisfactionRating = avgRatingRow && avgRatingRow.avg_rating 
      ? Number(avgRatingRow.avg_rating).toFixed(1) 
      : '5.0';
    const totalReviews = avgRatingRow ? Number(avgRatingRow.count) : 0;

    // Monthly breakdown for charts (last 6 months)
    const monthlySales = await db('orders')
      .where('status', 'Completed')
      .select(db.raw("strftime('%Y-%m', created_at) as month"))
      .sum('total_amount as revenue')
      .count('* as count')
      .groupBy('month')
      .orderBy('month', 'asc')
      .limit(6);

    // Category breakdown
    const categoryBreakdown = await db('categories')
      .leftJoin('entrepreneurs', 'categories.id', 'entrepreneurs.category_id')
      .select('categories.name')
      .count('entrepreneurs.id as count')
      .groupBy('categories.id')
      .orderBy('count', 'desc');

    return res.json({
      success: true,
      kpis: {
        totalEntrepreneurs,
        approvedEntrepreneurs,
        pendingEntrepreneurs,
        totalUsers,
        totalCustomers,
        totalRequests,
        completedRequests,
        conversionRate: `${conversionRate}%`,
        productSalesUnits: totalUnitsSold,
        completedOrdersCount,
        totalProductRevenue,
        totalServiceRevenue,
        totalPlatformRevenue,
        avgEntrepreneurEarnings: avgEarnings,
        avgSatisfactionRating: Number(avgSatisfactionRating),
        totalReviews
      },
      charts: {
        monthlySales,
        categoryBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin list all entrepreneurs with status filtering
exports.getEntrepreneursList = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = db('entrepreneurs')
      .join('users', 'entrepreneurs.user_id', 'users.id')
      .leftJoin('categories', 'entrepreneurs.category_id', 'categories.id');

    if (status && status !== 'all') {
      query = query.where('entrepreneurs.status', status);
    }

    const entrepreneurs = await query
      .select(
        'entrepreneurs.*',
        'users.full_name as owner_name',
        'users.email as owner_email',
        'users.phone as owner_phone',
        'categories.name as category_name'
      )
      .orderBy('entrepreneurs.created_at', 'desc');

    return res.json({ success: true, entrepreneurs });
  } catch (error) {
    next(error);
  }
};

// Admin approve, reject, or suspend entrepreneur
exports.updateEntrepreneurStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const entrepreneur = await db('entrepreneurs').where({ id }).first();
    if (!entrepreneur) {
      return res.status(404).json({ success: false, message: 'Entrepreneur not found' });
    }

    await db.transaction(async (trx) => {
      await trx('entrepreneurs').where({ id }).update({
        status,
        updated_at: trx.fn.now()
      });

      // Send in-app notification to the entrepreneur
      let notifMessage = `Your entrepreneur profile status has been updated to "${status}".`;
      if (status === 'approved') {
        notifMessage = 'Congratulations! Your profile has been approved and is now publicly visible to customers.';
      } else if (status === 'rejected') {
        notifMessage = `Your profile was rejected. Reason: ${reason || 'Does not meet verification standards.'}`;
      } else if (status === 'suspended') {
        notifMessage = `Your profile has been suspended. Reason: ${reason || 'Policy compliance review.'}`;
      }

      await trx('notifications').insert({
        user_id: entrepreneur.user_id,
        title: `Profile ${status.toUpperCase()}`,
        message: notifMessage,
        type: 'approval',
        link: '/entrepreneur/dashboard'
      });
    });

    const updated = await db('entrepreneurs').where({ id }).first();
    return res.json({
      success: true,
      message: `Entrepreneur status updated to ${status}`,
      entrepreneur: updated
    });
  } catch (error) {
    next(error);
  }
};
