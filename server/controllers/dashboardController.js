const db = require('../config/db');

// Entrepreneur Dashboard Summary & Earnings Overview
exports.getEntrepreneurDashboard = async (req, res, next) => {
  try {
    const entrepreneur = await db('entrepreneurs').where({ user_id: req.user.id }).first();
    if (!entrepreneur) {
      return res.status(404).json({ success: false, message: 'Entrepreneur profile not found' });
    }

    const entId = entrepreneur.id;

    // 1. EARNINGS OVERVIEW: ONLY FROM COMPLETED ORDERS AND REQUESTS!
    // Completed service requests earnings
    const completedServicesRow = await db('service_requests')
      .where({ entrepreneur_id: entId, status: 'Completed' })
      .sum('total_price as total')
      .count('* as count')
      .first();

    const serviceEarnings = Number(completedServicesRow.total) || 0;
    const completedServicesCount = Number(completedServicesRow.count) || 0;

    // Completed product sales earnings
    const completedProductsRow = await db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('order_items.entrepreneur_id', entId)
      .andWhere('orders.status', 'Completed')
      .sum('order_items.total_price as total')
      .sum('order_items.quantity as units')
      .first();

    const productEarnings = Number(completedProductsRow.total) || 0;
    const completedProductsUnits = Number(completedProductsRow.units) || 0;

    const totalEarnings = serviceEarnings + productEarnings;

    // Per-month earnings breakdown from Completed orders & requests
    // Monthly services
    const monthlyServices = await db('service_requests')
      .where({ entrepreneur_id: entId, status: 'Completed' })
      .select(db.raw("strftime('%Y-%m', created_at) as month"))
      .sum('total_price as amount')
      .groupBy('month');

    // Monthly products
    const monthlyProducts = await db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .where('order_items.entrepreneur_id', entId)
      .andWhere('orders.status', 'Completed')
      .select(db.raw("strftime('%Y-%m', orders.created_at) as month"))
      .sum('order_items.total_price as amount')
      .groupBy('month');

    // Merge monthly amounts
    const monthlyMap = {};
    monthlyServices.forEach((m) => {
      const month = m.month || 'Current';
      monthlyMap[month] = (monthlyMap[month] || 0) + Number(m.amount);
    });
    monthlyProducts.forEach((m) => {
      const month = m.month || 'Current';
      monthlyMap[month] = (monthlyMap[month] || 0) + Number(m.amount);
    });

    const monthlyBreakdown = Object.keys(monthlyMap)
      .sort()
      .map((month) => ({
        month,
        earnings: parseFloat(monthlyMap[month].toFixed(2))
      }));

    // 2. Active counts
    const pendingRequestsCountRow = await db('service_requests')
      .where({ entrepreneur_id: entId, status: 'Pending' })
      .count('* as count')
      .first();
    const pendingRequestsCount = Number(pendingRequestsCountRow.count) || 0;

    const activeOrdersCountRow = await db('orders')
      .whereIn('orders.id', function () {
        this.select('order_id').from('order_items').where('entrepreneur_id', entId);
      })
      .whereIn('orders.status', ['Placed', 'Confirmed', 'Ready'])
      .count('* as count')
      .first();
    const activeOrdersCount = Number(activeOrdersCountRow.count) || 0;

    const totalServicesRow = await db('services').where({ entrepreneur_id: entId, is_active: true }).count('* as count').first();
    const totalServicesCount = Number(totalServicesRow.count) || 0;

    const totalProductsRow = await db('products').where({ entrepreneur_id: entId, is_active: true }).count('* as count').first();
    const totalProductsCount = Number(totalProductsRow.count) || 0;

    // Recent items
    const recentRequests = await db('service_requests')
      .join('services', 'service_requests.service_id', 'services.id')
      .join('users as customers', 'service_requests.customer_id', 'customers.id')
      .where('service_requests.entrepreneur_id', entId)
      .select(
        'service_requests.*',
        'services.title as service_title',
        'customers.full_name as customer_name',
        'customers.phone as customer_phone'
      )
      .orderBy('service_requests.created_at', 'desc')
      .limit(5);

    const recentOrders = await db('orders')
      .join('users as customers', 'orders.customer_id', 'customers.id')
      .whereIn('orders.id', function () {
        this.select('order_id').from('order_items').where('entrepreneur_id', entId);
      })
      .select('orders.*', 'customers.full_name as customer_name')
      .orderBy('orders.created_at', 'desc')
      .limit(5);

    return res.json({
      success: true,
      entrepreneur,
      earnings: {
        totalEarnings,
        serviceEarnings,
        productEarnings,
        completedServicesCount,
        completedProductsUnits,
        monthlyBreakdown
      },
      counts: {
        pendingRequestsCount,
        activeOrdersCount,
        totalServicesCount,
        totalProductsCount
      },
      recentRequests,
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};

// Customer Dashboard Summary
exports.getCustomerDashboard = async (req, res, next) => {
  try {
    const customer_id = req.user.id;

    const activeRequests = await db('service_requests')
      .join('services', 'service_requests.service_id', 'services.id')
      .join('entrepreneurs', 'service_requests.entrepreneur_id', 'entrepreneurs.id')
      .where('service_requests.customer_id', customer_id)
      .whereNotIn('service_requests.status', ['Completed', 'Cancelled', 'Rejected'])
      .select(
        'service_requests.*',
        'services.title as service_title',
        'entrepreneurs.business_name as entrepreneur_name',
        'entrepreneurs.city as entrepreneur_city'
      )
      .orderBy('service_requests.booking_date', 'asc');

    const activeOrders = await db('orders')
      .where('customer_id', customer_id)
      .whereNotIn('status', ['Completed', 'Cancelled'])
      .orderBy('created_at', 'desc');

    const completedServicesWithoutReview = await db('service_requests')
      .join('services', 'service_requests.service_id', 'services.id')
      .join('entrepreneurs', 'service_requests.entrepreneur_id', 'entrepreneurs.id')
      .leftJoin('reviews', 'service_requests.id', 'reviews.service_request_id')
      .where('service_requests.customer_id', customer_id)
      .andWhere('service_requests.status', 'Completed')
      .whereNull('reviews.id')
      .select(
        'service_requests.id',
        'service_requests.booking_date',
        'services.title as service_title',
        'entrepreneurs.id as entrepreneur_id',
        'entrepreneurs.business_name as entrepreneur_name'
      );

    const completedOrdersWithoutReview = await db('orders')
      .leftJoin('reviews', 'orders.id', 'reviews.order_id')
      .where('orders.customer_id', customer_id)
      .andWhere('orders.status', 'Completed')
      .whereNull('reviews.id')
      .select('orders.id', 'orders.total_amount', 'orders.created_at');

    return res.json({
      success: true,
      activeRequests,
      activeOrders,
      pendingReviews: {
        services: completedServicesWithoutReview,
        orders: completedOrdersWithoutReview
      }
    });
  } catch (error) {
    next(error);
  }
};
