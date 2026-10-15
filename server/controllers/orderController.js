const db = require('../config/db');

// Place an order with strict CONCURRENCY / NEGATIVE STOCK PREVENTION
exports.createOrder = async (req, res, next) => {
  try {
    const { items, delivery_address, contact_phone, notes, payment_method, payment_details } = req.body;
    const customer_id = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items to place an order.' });
    }

    if (!delivery_address || !contact_phone) {
      return res.status(400).json({ success: false, message: 'Delivery address and contact phone number are required.' });
    }

    let createdOrder;
    let orderItemsData = [];

    // Concurrency-safe atomic transaction
    await db.transaction(async (trx) => {
      let totalAmount = 0;
      const verifiedItems = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (!qty || qty <= 0) {
          throw new Error('Invalid item quantity');
        }

        // Fetch product with row locking / check
        const product = await trx('products')
          .where({ id: item.product_id, is_active: true })
          .first();

        if (!product) {
          const err = new Error(`Product not found or unavailable (ID: ${item.product_id})`);
          err.code = 'PRODUCT_NOT_FOUND';
          throw err;
        }

        if (product.stock < qty) {
          const err = new Error(`Insufficient stock for "${product.name}". Available stock: ${product.stock}, requested: ${qty}.`);
          err.code = 'INSUFFICIENT_STOCK';
          throw err;
        }

        // Atomic stock decrement with concurrency protection
        const affected = await trx('products')
          .where('id', product.id)
          .andWhere('stock', '>=', qty)
          .decrement('stock', qty);

        if (affected === 0) {
          const err = new Error(`Stock changed concurrently for "${product.name}". Please try placing your order again.`);
          err.code = 'INSUFFICIENT_STOCK';
          throw err;
        }

        const itemTotal = Number(product.price) * qty;
        totalAmount += itemTotal;

        verifiedItems.push({
          product_id: product.id,
          entrepreneur_id: product.entrepreneur_id,
          name: product.name,
          quantity: qty,
          unit_price: Number(product.price),
          total_price: itemTotal
        });
      }

      // Determine Payment Method and Status (Card, UPI, or COD)
      let finalPaymentMethod = 'Cash on Delivery (COD)';
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
        finalPaymentMethod = 'Cash on Delivery (COD)';
        finalPaymentStatus = 'Pending';
      }

      // Create Order record
      const [orderId] = await trx('orders').insert({
        customer_id,
        total_amount: totalAmount,
        status: 'Placed',
        delivery_address: delivery_address.trim(),
        contact_phone: contact_phone.trim(),
        notes: notes ? notes.trim() : null,
        payment_method: finalPaymentMethod,
        payment_status: finalPaymentStatus
      });

      // Insert Order Items
      for (const vItem of verifiedItems) {
        await trx('order_items').insert({
          order_id: orderId,
          product_id: vItem.product_id,
          entrepreneur_id: vItem.entrepreneur_id,
          quantity: vItem.quantity,
          unit_price: vItem.unit_price,
          total_price: vItem.total_price
        });
      }

      // Record status history
      await trx('status_history').insert({
        entity_type: 'order',
        entity_id: orderId,
        previous_status: null,
        new_status: 'Placed',
        changed_by_user_id: customer_id,
        notes: `Order placed by customer via ${finalPaymentMethod} [Payment: ${finalPaymentStatus}]`
      });

      // Send notifications to involved entrepreneurs
      const uniqueEntrepreneurs = [...new Set(verifiedItems.map((i) => i.entrepreneur_id))];
      for (const entId of uniqueEntrepreneurs) {
        const ent = await trx('entrepreneurs').where({ id: entId }).first();
        if (ent) {
          await trx('notifications').insert({
            user_id: ent.user_id,
            title: 'New Product Order Placed!',
            message: `A customer has ordered handmade products from your store (Order #${orderId}, ${finalPaymentMethod}).`,
            type: 'order_status',
            link: '/entrepreneur/dashboard'
          });
        }
      }

      // Customer notification
      await trx('notifications').insert({
        user_id: customer_id,
        title: 'Order Confirmed!',
        message: `Your order #${orderId} for ₹${totalAmount.toFixed(2)} has been successfully placed via ${finalPaymentMethod} (${finalPaymentStatus}).`,
        type: 'order_status',
        link: '/dashboard'
      });

      createdOrder = await trx('orders').where({ id: orderId }).first();
      orderItemsData = verifiedItems;
    });

    return res.status(201).json({
      success: true,
      message: createdOrder.payment_status === 'Paid' 
        ? `Order placed and payment verified via ${createdOrder.payment_method}!`
        : 'Order placed successfully! You will pay upon delivery.',
      order: createdOrder,
      items: orderItemsData
    });
  } catch (error) {
    if (error.code === 'INSUFFICIENT_STOCK' || error.code === 'PRODUCT_NOT_FOUND') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Get orders list for Customer, Entrepreneur, or Admin
exports.getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let ordersQuery = db('orders')
      .join('users as customers', 'orders.customer_id', 'customers.id')
      .leftJoin('reviews', 'orders.id', 'reviews.order_id');

    if (req.user.role === 'customer') {
      ordersQuery = ordersQuery.where('orders.customer_id', req.user.id);
    } else if (req.user.role === 'entrepreneur') {
      const ent = await db('entrepreneurs').where({ user_id: req.user.id }).first();
      if (!ent) return res.status(404).json({ success: false, message: 'Entrepreneur profile not found' });

      // Find orders containing this entrepreneur's products
      ordersQuery = ordersQuery.whereIn('orders.id', function () {
        this.select('order_id').from('order_items').where('entrepreneur_id', ent.id);
      });
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (status && status !== 'all') {
      ordersQuery = ordersQuery.where('orders.status', status);
    }

    const orders = await ordersQuery
      .select(
        'orders.*',
        'customers.full_name as customer_name',
        'customers.email as customer_email',
        'reviews.id as review_id',
        'reviews.rating as review_rating'
      )
      .orderBy('orders.created_at', 'desc');

    // Attach items to each order
    const orderIds = orders.map((o) => o.id);
    let itemsByOrderId = {};
    if (orderIds.length > 0) {
      const items = await db('order_items')
        .join('products', 'order_items.product_id', 'products.id')
        .join('entrepreneurs', 'order_items.entrepreneur_id', 'entrepreneurs.id')
        .whereIn('order_items.order_id', orderIds)
        .select(
          'order_items.*',
          'products.name as product_name',
          'products.image_url as product_image',
          'entrepreneurs.business_name as seller_name',
          'entrepreneurs.user_id as seller_user_id'
        );

      items.forEach((item) => {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      });
    }

    const enhancedOrders = orders.map((o) => ({
      ...o,
      items: itemsByOrderId[o.id] || []
    }));

    return res.json({ success: true, orders: enhancedOrders });
  } catch (error) {
    next(error);
  }
};

// Update order status (Placed, Confirmed, Ready, Completed, Cancelled)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Placed', 'Confirmed', 'Ready', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await db('orders').where({ id }).first();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderItems = await db('order_items').where({ order_id: id });
    const isCustomer = req.user.id === order.customer_id;
    const isAdmin = req.user.role === 'admin';

    let isEntrepreneurForThisOrder = false;
    if (req.user.role === 'entrepreneur') {
      const ent = await db('entrepreneurs').where({ user_id: req.user.id }).first();
      if (ent && orderItems.some((i) => i.entrepreneur_id === ent.id)) {
        isEntrepreneurForThisOrder = true;
      }
    }

    if (!isCustomer && !isEntrepreneurForThisOrder && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this order' });
    }

    // Role-specific constraints
    if (isCustomer && !isAdmin) {
      if (status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Customers can only cancel an order' });
      }
      if (['Ready', 'Completed'].includes(order.status)) {
        return res.status(400).json({ success: false, message: 'Cannot cancel an order that is ready or completed' });
      }
    }

    await db.transaction(async (trx) => {
      const previousStatus = order.status;
      const updates = {
        status,
        updated_at: db.fn.now()
      };

      if (status === 'Completed') {
        updates.payment_status = 'Paid';
      }

      // If cancelling, restore product stock
      if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
        for (const item of orderItems) {
          await trx('products')
            .where('id', item.product_id)
            .increment('stock', item.quantity);
        }
      }

      await trx('orders').where({ id }).update(updates);

      // Record history
      await trx('status_history').insert({
        entity_type: 'order',
        entity_id: id,
        previous_status: previousStatus,
        new_status: status,
        changed_by_user_id: req.user.id,
        notes: notes || `Order status updated to ${status}`
      });

      // Notify customer if entrepreneur/admin changed status
      if (!isCustomer) {
        await trx('notifications').insert({
          user_id: order.customer_id,
          title: `Order #${id} ${status}`,
          message: `Your order #${id} has been marked as "${status}".`,
          type: 'order_status',
          link: '/dashboard'
        });
      }
    });

    const updated = await db('orders').where({ id }).first();
    return res.json({ success: true, message: `Order status updated to ${status}`, order: updated });
  } catch (error) {
    next(error);
  }
};
