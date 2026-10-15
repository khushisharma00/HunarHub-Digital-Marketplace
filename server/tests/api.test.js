const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const initDatabase = require('../config/initDb');

let adminToken;
let customerToken;
let customerUserId;
let entrepreneurToken;
let entrepreneurId;
let entrepreneurUserId;
let otherEntrepreneurToken;
let otherEntrepreneurId;

let categoryId;
let createdServiceId;
let createdProductId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await initDatabase();

  // Clean tables
  await db('status_history').del();
  await db('disputes').del();
  await db('reviews').del();
  await db('notifications').del();
  await db('order_items').del();
  await db('orders').del();
  await db('service_requests').del();
  await db('availability_slots').del();
  await db('products').del();
  await db('services').del();
  await db('entrepreneurs').del();
  await db('categories').del();
  await db('users').del();

  // Create test category
  const [catId] = await db('categories').insert({
    name: 'Potter (Kumhar)',
    slug: 'potter-kumhar',
    description: 'Traditional pottery and terracotta',
    icon: 'Sparkles'
  });
  categoryId = catId;
});

afterAll(async () => {
  await db.destroy();
});

describe('1. Authentication & Role-Based Access Control', () => {
  it('should register a customer successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Test Customer',
        email: 'customer_test@example.com',
        password: 'password123',
        role: 'customer',
        phone: '+91 99999 11111'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('customer');

    customerToken = res.body.token;
    customerUserId = res.body.user.id;
  });

  it('should register an entrepreneur in pending status', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Test Artisan',
        email: 'artisan_test@example.com',
        password: 'password123',
        role: 'entrepreneur',
        phone: '+91 99999 22222',
        business_name: 'Artisan Clay Works',
        category_id: categoryId,
        skill_type: 'Clay Potter',
        experience_years: 10,
        bio: 'Authentic clay pottery maker',
        city: 'Jaipur',
        area: 'Amer'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('entrepreneur');
    expect(res.body.entrepreneur.status).toBe('pending');

    entrepreneurToken = res.body.token;
    entrepreneurId = res.body.entrepreneur.id;
    entrepreneurUserId = res.body.user.id;
  });

  it('should register a second entrepreneur for ownership conflict tests', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Second Artisan',
        email: 'artisan2_test@example.com',
        password: 'password123',
        role: 'entrepreneur',
        phone: '+91 99999 33333',
        business_name: 'Second Studio',
        category_id: categoryId,
        skill_type: 'Sculptor',
        city: 'Delhi',
        area: 'Karol Bagh'
      });

    expect(res.status).toBe(201);
    otherEntrepreneurToken = res.body.token;
    otherEntrepreneurId = res.body.entrepreneur.id;
  });

  it('should register an admin account directly in database and login', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await db('users').insert({
      full_name: 'Platform Admin',
      email: 'admin_test@example.com',
      password_hash: hash,
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin_test@example.com',
        password: 'admin123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    adminToken = res.body.token;
  });

  it('should reject login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer_test@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should deny customer access to admin routes (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Entrepreneur Verification & Visibility Rules', () => {
  it('should NOT show pending entrepreneur in public browse list', async () => {
    const res = await request(app).get('/api/entrepreneurs');
    expect(res.status).toBe(200);
    const found = res.body.entrepreneurs.find((e) => e.id === entrepreneurId);
    expect(found).toBeUndefined();
  });

  it('should allow admin to approve entrepreneur', async () => {
    const res = await request(app)
      .patch(`/api/admin/entrepreneurs/${entrepreneurId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.entrepreneur.status).toBe('approved');
  });

  it('should now show approved entrepreneur in public browse list', async () => {
    const res = await request(app).get('/api/entrepreneurs');
    expect(res.status).toBe(200);
    const found = res.body.entrepreneurs.find((e) => e.id === entrepreneurId);
    expect(found).toBeDefined();
    expect(found.business_name).toBe('Artisan Clay Works');
  });
});

describe('3. Services & Products CRUD with Ownership Enforcement', () => {
  it('should allow entrepreneur to create a service', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${entrepreneurToken}`)
      .send({
        title: 'Pottery Wheel Session',
        description: 'Hands-on pottery workshop with clay included',
        price: 450.00,
        duration_mins: 60,
        category_id: categoryId
      });

    expect(res.status).toBe(201);
    expect(res.body.service.title).toBe('Pottery Wheel Session');
    createdServiceId = res.body.service.id;
  });

  it('should prevent another entrepreneur from editing or deleting that service (403)', async () => {
    const res = await request(app)
      .put(`/api/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${otherEntrepreneurToken}`)
      .send({ price: 100.00 });

    expect(res.status).toBe(403);
  });

  it('should allow owner to update service', async () => {
    const res = await request(app)
      .put(`/api/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${entrepreneurToken}`)
      .send({ price: 500.00 });

    expect(res.status).toBe(200);
    expect(Number(res.body.service.price)).toBe(500.00);
  });

  it('should allow entrepreneur to create a product with stock', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${entrepreneurToken}`)
      .send({
        name: 'Terracotta Water Pot',
        description: 'Traditional cooling earthen matka',
        price: 350.00,
        stock: 5,
        category_id: categoryId
      });

    expect(res.status).toBe(201);
    expect(res.body.product.stock).toBe(5);
    createdProductId = res.body.product.id;
  });

  it('should prevent another entrepreneur from editing product (403)', async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${otherEntrepreneurToken}`)
      .send({ price: 99.00 });

    expect(res.status).toBe(403);
  });
});

describe('4. Search, Filter, and Pagination', () => {
  it('should filter entrepreneurs by city', async () => {
    const res = await request(app).get('/api/entrepreneurs?city=Jaipur');
    expect(res.status).toBe(200);
    expect(res.body.entrepreneurs.length).toBeGreaterThan(0);
    expect(res.body.entrepreneurs[0].city).toBe('Jaipur');
  });

  it('should return empty list for non-matching search term', async () => {
    const res = await request(app).get('/api/entrepreneurs?q=nonexistentkeyword12345');
    expect(res.status).toBe(200);
    expect(res.body.entrepreneurs.length).toBe(0);
  });

  it('should paginate results with page and limit', async () => {
    const res = await request(app).get('/api/entrepreneurs?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.entrepreneurs.length).toBe(1);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(1);
  });
});

describe('5. Concurrency Safety: Double-Booking Prevention', () => {
  const bookingDate = '2026-11-15';
  const timeSlot = '10:00 - 11:00';

  it('should book an available service slot successfully', async () => {
    const res = await request(app)
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_id: createdServiceId,
        booking_date: bookingDate,
        time_slot: timeSlot,
        address: '101, Test Lane, Jaipur'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.request.status).toBe('Pending');
  });

  it('CONCURRENCY TEST: should reject duplicate booking for the SAME slot & date with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_id: createdServiceId,
        booking_date: bookingDate,
        time_slot: timeSlot,
        address: 'Another Address, Jaipur'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already booked');
  });
});

describe('6. Concurrency Safety: Overselling & Stock Integrity', () => {
  it('CONCURRENCY TEST: should reject order when requested quantity exceeds available stock (400)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: createdProductId, quantity: 999 }], // only 5 in stock!
        delivery_address: 'Test Residence, Jaipur',
        contact_phone: '+91 99999 44444'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient stock');
  });

  it('should process order when stock is sufficient and decrement inventory atomically', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: createdProductId, quantity: 3 }],
        delivery_address: 'Test Residence, Jaipur',
        contact_phone: '+91 99999 44444'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify stock is now 5 - 3 = 2
    const product = await db('products').where({ id: createdProductId }).first();
    expect(product.stock).toBe(2);
  });
});

describe('7. Status Transitions, History Tracking, and Notifications', () => {
  let requestId;

  beforeAll(async () => {
    const sReq = await db('service_requests').where({ service_id: createdServiceId }).first();
    requestId = sReq.id;
  });

  it('should transition service request status through full flow', async () => {
    // 1. Entrepreneur accepts
    let res = await request(app)
      .patch(`/api/service-requests/${requestId}/status`)
      .set('Authorization', `Bearer ${entrepreneurToken}`)
      .send({ status: 'Accepted' });
    expect(res.status).toBe(200);

    // 2. Entrepreneur marks in progress
    res = await request(app)
      .patch(`/api/service-requests/${requestId}/status`)
      .set('Authorization', `Bearer ${entrepreneurToken}`)
      .send({ status: 'In progress' });
    expect(res.status).toBe(200);

    // 3. Entrepreneur marks completed
    res = await request(app)
      .patch(`/api/service-requests/${requestId}/status`)
      .set('Authorization', `Bearer ${entrepreneurToken}`)
      .send({ status: 'Completed' });
    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('Completed');
    expect(res.body.request.payment_status).toBe('Paid');
  });

  it('should record complete status history with timestamps', async () => {
    const res = await request(app)
      .get(`/api/service-requests/${requestId}/history`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.history.length).toBeGreaterThanOrEqual(4);
    const statuses = res.body.history.map((h) => h.new_status);
    expect(statuses).toContain('Pending');
    expect(statuses).toContain('Accepted');
    expect(statuses).toContain('In progress');
    expect(statuses).toContain('Completed');
  });

  it('should send in-app notification to customer', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThan(0);
    const notif = res.body.notifications[0];

    // Mark as read
    const readRes = await request(app)
      .patch(`/api/notifications/${notif.id}/read`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(readRes.status).toBe(200);
  });
});

describe('8. Customer Ratings & Reviews Rules', () => {
  let completedRequestId;

  beforeAll(async () => {
    const reqRow = await db('service_requests').where({ status: 'Completed' }).first();
    completedRequestId = reqRow.id;
  });

  it('should allow customer to submit review on Completed request', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_request_id: completedRequestId,
        rating: 5,
        comment: 'Master potter! Outstanding quality clay work.'
      });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);

    // Verify entrepreneur rating was updated
    const ent = await db('entrepreneurs').where({ id: entrepreneurId }).first();
    expect(ent.rating_avg).toBe(5.0);
    expect(ent.rating_count).toBe(1);
  });

  it('should REJECT duplicate second review on the same request (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_request_id: completedRequestId,
        rating: 4,
        comment: 'Trying to review again'
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already reviewed');
  });
});

describe('9. Earnings Calculation (Completed Orders & Requests Only)', () => {
  it('should calculate earnings strictly from Completed status', async () => {
    const res = await request(app)
      .get('/api/dashboard/entrepreneur')
      .set('Authorization', `Bearer ${entrepreneurToken}`);

    expect(res.status).toBe(200);
    expect(res.body.earnings).toBeDefined();
    expect(Number(res.body.earnings.serviceEarnings)).toBe(500.00); // 1 completed request of ₹500
    expect(res.body.earnings.completedServicesCount).toBe(1);
  });
});

describe('10. Dispute Management Flow', () => {
  let disputeId;

  it('should allow customer to raise dispute', async () => {
    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_request_id: 1,
        reason: 'Service timing mismatch',
        details: 'The artisan arrived 30 minutes after scheduled time.'
      });

    expect(res.status).toBe(201);
    expect(res.body.dispute.status).toBe('Open');
    disputeId = res.body.dispute.id;
  });

  it('should allow admin to resolve dispute with decision', async () => {
    const res = await request(app)
      .patch(`/api/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        admin_decision: 'Artisan warned to adhere strictly to time slot. Resolution closed amicably.'
      });

    expect(res.status).toBe(200);
    expect(res.body.dispute.status).toBe('Resolved');
    expect(res.body.dispute.admin_decision).toContain('Artisan warned');
  });
});

describe('11. Platform Admin Analytics KPIs', () => {
  it('should calculate accurate platform KPIs and charts', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const kpis = res.body.kpis;
    expect(kpis.totalEntrepreneurs).toBeGreaterThanOrEqual(2);
    expect(kpis.approvedEntrepreneurs).toBeGreaterThanOrEqual(1);
    expect(kpis.totalUsers).toBeGreaterThanOrEqual(3);
    expect(kpis.conversionRate).toBeDefined();
    expect(kpis.avgSatisfactionRating).toBeGreaterThanOrEqual(1);
  });
});

describe('12. Payment Options: COD, Card, and UPI Handling', () => {
  let paymentProductId;

  beforeAll(async () => {
    // Create product with plenty of stock for payment tests
    const [pId] = await db('products').insert({
      entrepreneur_id: 1,
      category_id: categoryId,
      name: 'Handcrafted Blue Pottery Plate',
      description: 'Stunning Rajasthani ceramic plate',
      price: 650.00,
      stock: 50,
      is_active: true
    });
    paymentProductId = pId;
  });

  it('should process order with Cash on Delivery (COD) and record Pending status', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: paymentProductId, quantity: 1 }],
        delivery_address: '101 Civil Lines, Jaipur',
        contact_phone: '+91 98765 00001',
        payment_method: 'COD'
      });

    expect(res.status).toBe(201);
    expect(res.body.order.payment_method).toBe('Cash on Delivery (COD)');
    expect(res.body.order.payment_status).toBe('Pending');
  });

  it('should process order with UPI payment and record Paid status', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: paymentProductId, quantity: 1 }],
        delivery_address: '102 Civil Lines, Jaipur',
        contact_phone: '+91 98765 00002',
        payment_method: 'UPI',
        payment_details: { upi_id: 'customer@okhdfcbank' }
      });

    expect(res.status).toBe(201);
    expect(res.body.order.payment_method).toBe('UPI (customer@okhdfcbank)');
    expect(res.body.order.payment_status).toBe('Paid');
  });

  it('should process order with Card payment and record masked brand and Paid status', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ product_id: paymentProductId, quantity: 1 }],
        delivery_address: '103 Civil Lines, Jaipur',
        contact_phone: '+91 98765 00003',
        payment_method: 'CARD',
        payment_details: {
          card_number: '4111 2222 3333 4242',
          card_brand: 'Visa',
          card_name: 'TEST CUSTOMER'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.order.payment_method).toBe('Visa ending in 4242');
    expect(res.body.order.payment_status).toBe('Paid');
  });

  it('should book service request with UPI payment and record Paid status', async () => {
    const res = await request(app)
      .post('/api/service-requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        service_id: createdServiceId,
        booking_date: '2026-11-20',
        time_slot: '14:00 - 15:00',
        address: '104 Civil Lines, Jaipur',
        payment_method: 'UPI',
        payment_details: { upi_id: 'customer@okaxis' }
      });

    expect(res.status).toBe(201);
    expect(res.body.request.payment_method).toBe('UPI (customer@okaxis)');
    expect(res.body.request.payment_status).toBe('Paid');
  });
});

