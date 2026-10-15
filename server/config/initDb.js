const db = require('./db');

async function initDatabase() {
  // 1. Users Table
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('full_name').notNullable();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('role').notNullable().defaultTo('customer'); // 'customer', 'entrepreneur', 'admin'
      table.string('phone');
      table.string('avatar');
      table.timestamps(true, true);
    });
  }

  // 2. Categories Table
  const hasCategories = await db.schema.hasTable('categories');
  if (!hasCategories) {
    await db.schema.createTable('categories', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('slug').notNullable().unique();
      table.text('description');
      table.string('icon');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 3. Micro-Entrepreneurs Profile Table
  const hasEntrepreneurs = await db.schema.hasTable('entrepreneurs');
  if (!hasEntrepreneurs) {
    await db.schema.createTable('entrepreneurs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().unique()
        .references('id').inTable('users').onDelete('CASCADE');
      table.integer('category_id').unsigned()
        .references('id').inTable('categories').onDelete('SET NULL');
      table.string('business_name').notNullable();
      table.string('skill_type').notNullable();
      table.integer('experience_years').defaultTo(0);
      table.text('bio');
      table.string('city').notNullable().index();
      table.string('area').notNullable();
      table.text('address');
      table.string('profile_photo');
      table.string('status').notNullable().defaultTo('pending').index(); // 'pending', 'approved', 'rejected', 'suspended'
      table.float('rating_avg').defaultTo(0.0);
      table.integer('rating_count').defaultTo(0);
      table.timestamps(true, true);
    });
  }

  // 4. Services Table
  const hasServices = await db.schema.hasTable('services');
  if (!hasServices) {
    await db.schema.createTable('services', (table) => {
      table.increments('id').primary();
      table.integer('entrepreneur_id').unsigned().notNullable()
        .references('id').inTable('entrepreneurs').onDelete('CASCADE').index();
      table.integer('category_id').unsigned()
        .references('id').inTable('categories').onDelete('SET NULL');
      table.string('title').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.integer('duration_mins').defaultTo(60);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 5. Products Table
  const hasProducts = await db.schema.hasTable('products');
  if (!hasProducts) {
    await db.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.integer('entrepreneur_id').unsigned().notNullable()
        .references('id').inTable('entrepreneurs').onDelete('CASCADE').index();
      table.integer('category_id').unsigned()
        .references('id').inTable('categories').onDelete('SET NULL');
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.integer('stock').notNullable().defaultTo(0);
      table.string('image_url');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 6. Availability Slots Table
  const hasSlots = await db.schema.hasTable('availability_slots');
  if (!hasSlots) {
    await db.schema.createTable('availability_slots', (table) => {
      table.increments('id').primary();
      table.integer('entrepreneur_id').unsigned().notNullable()
        .references('id').inTable('entrepreneurs').onDelete('CASCADE').index();
      table.string('day_of_week').notNullable(); // 'Monday', 'Tuesday', ...
      table.string('start_time').notNullable(); // '09:00'
      table.string('end_time').notNullable(); // '10:00'
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 7. Service Requests Table
  const hasServiceRequests = await db.schema.hasTable('service_requests');
  if (!hasServiceRequests) {
    await db.schema.createTable('service_requests', (table) => {
      table.increments('id').primary();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE').index();
      table.integer('entrepreneur_id').unsigned().notNullable()
        .references('id').inTable('entrepreneurs').onDelete('CASCADE').index();
      table.integer('service_id').unsigned().notNullable()
        .references('id').inTable('services').onDelete('CASCADE');
      table.string('booking_date').notNullable().index(); // 'YYYY-MM-DD'
      table.string('time_slot').notNullable().index(); // '10:00 - 11:00'
      table.text('address').notNullable();
      table.text('notes');
      table.decimal('total_price', 10, 2).notNullable();
      table.string('status').notNullable().defaultTo('Pending').index(); 
      // 'Pending', 'Accepted', 'Rejected', 'In progress', 'Completed', 'Cancelled', 'Disputed'
      table.string('payment_method').defaultTo('Pay on service completion');
      table.string('payment_status').defaultTo('Pending');
      table.timestamps(true, true);
    });
  }

  // 8. Orders Table
  const hasOrders = await db.schema.hasTable('orders');
  if (!hasOrders) {
    await db.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE').index();
      table.decimal('total_amount', 10, 2).notNullable();
      table.string('status').notNullable().defaultTo('Placed').index();
      // 'Placed', 'Confirmed', 'Ready', 'Completed', 'Cancelled'
      table.text('delivery_address').notNullable();
      table.string('contact_phone').notNullable();
      table.text('notes');
      table.string('payment_method').defaultTo('Pay on delivery');
      table.string('payment_status').defaultTo('Pending');
      table.timestamps(true, true);
    });
  }

  // 9. Order Items Table
  const hasOrderItems = await db.schema.hasTable('order_items');
  if (!hasOrderItems) {
    await db.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable()
        .references('id').inTable('orders').onDelete('CASCADE').index();
      table.integer('product_id').unsigned().notNullable()
        .references('id').inTable('products');
      table.integer('entrepreneur_id').unsigned().notNullable()
        .references('id').inTable('entrepreneurs').index();
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 10, 2).notNullable();
      table.decimal('total_price', 10, 2).notNullable();
    });
  }

  // 10. Reviews Table
  const hasReviews = await db.schema.hasTable('reviews');
  if (!hasReviews) {
    await db.schema.createTable('reviews', (table) => {
      table.increments('id').primary();
      table.integer('customer_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE');
      table.integer('entrepreneur_id').unsigned().notNullable()
        .references('id').inTable('entrepreneurs').onDelete('CASCADE').index();
      table.integer('service_request_id').unsigned()
        .references('id').inTable('service_requests').onDelete('CASCADE').unique();
      table.integer('order_id').unsigned()
        .references('id').inTable('orders').onDelete('CASCADE').unique();
      table.integer('rating').notNullable(); // 1 to 5
      table.text('comment');
      table.timestamps(true, true);
    });
  }

  // 11. Notifications Table
  const hasNotifications = await db.schema.hasTable('notifications');
  if (!hasNotifications) {
    await db.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE').index();
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.string('type').notNullable(); // 'request_status', 'order_status', 'approval', 'dispute', etc.
      table.string('link');
      table.boolean('is_read').defaultTo(false).index();
      table.timestamps(true, true);
    });
  }

  // 12. Disputes Table
  const hasDisputes = await db.schema.hasTable('disputes');
  if (!hasDisputes) {
    await db.schema.createTable('disputes', (table) => {
      table.increments('id').primary();
      table.integer('raised_by_user_id').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE').index();
      table.integer('against_user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.integer('service_request_id').unsigned()
        .references('id').inTable('service_requests').onDelete('SET NULL');
      table.integer('order_id').unsigned()
        .references('id').inTable('orders').onDelete('SET NULL');
      table.string('reason').notNullable();
      table.text('details').notNullable();
      table.string('status').notNullable().defaultTo('Open').index(); // 'Open', 'Under Review', 'Resolved', 'Dismissed'
      table.text('admin_decision');
      table.timestamp('resolved_at');
      table.timestamps(true, true);
    });
  }

  // 13. Status History Table
  const hasStatusHistory = await db.schema.hasTable('status_history');
  if (!hasStatusHistory) {
    await db.schema.createTable('status_history', (table) => {
      table.increments('id').primary();
      table.string('entity_type').notNullable().index(); // 'service_request' or 'order'
      table.integer('entity_id').unsigned().notNullable().index();
      table.string('previous_status');
      table.string('new_status').notNullable();
      table.integer('changed_by_user_id').unsigned()
        .references('id').inTable('users').onDelete('SET NULL');
      table.text('notes');
      table.timestamps(true, true);
    });
  }

  return true;
}

module.exports = initDatabase;
