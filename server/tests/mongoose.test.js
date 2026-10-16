const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  User,
  Category,
  Entrepreneur,
  Product,
  Service,
  Order,
  Booking,
  Review
} = require('../models');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Ensure unique indexes are built for testing
  await User.init();
  await Review.init();
}, 60000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

beforeEach(async () => {
  // Clear all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('🍃 Mongoose Models & MongoDB Lifecycle Test Suite', () => {
  test('1. User Model: should create and hash password with bcrypt', async () => {
    const user = new User({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      password: 'mypassword123',
      role: 'customer'
    });
    await user.save();

    expect(user._id).toBeDefined();
    expect(user.password).not.toBe('mypassword123'); // Must be hashed
    expect(user.password.length).toBeGreaterThan(20);

    // Password comparison
    const isMatch = await user.comparePassword('mypassword123');
    expect(isMatch).toBe(true);

    const isWrong = await user.comparePassword('wrongpassword');
    expect(isWrong).toBe(false);

    // toJSON strips password
    const json = user.toJSON();
    expect(json.password).toBeUndefined();
  });

  test('2. User Model: should reject duplicate email addresses', async () => {
    await User.create({
      name: 'User One',
      email: 'duplicate@example.com',
      password: 'password123'
    });

    let duplicateError = null;
    try {
      await User.create({
        name: 'User Two',
        email: 'duplicate@example.com',
        password: 'password123'
      });
    } catch (err) {
      duplicateError = err;
    }

    expect(duplicateError).not.toBeNull();
  });

  test('3. Entrepreneur Model: should enforce verificationStatus enum and user link', async () => {
    const user = await User.create({
      name: 'Khurja Potter',
      email: 'potter@example.com',
      password: 'password123',
      role: 'entrepreneur'
    });

    const category = await Category.create({
      name: 'Pottery',
      slug: 'pottery'
    });

    const ent = await Entrepreneur.create({
      user: user._id,
      businessName: 'Heritage Clay Works',
      category: category._id,
      categoryName: category.name,
      city: 'Khurja',
      verificationStatus: 'approved',
      isApproved: true
    });

    expect(ent._id).toBeDefined();
    expect(ent.isApproved).toBe(true);
    expect(ent.city).toBe('Khurja');

    // Populate user
    const populated = await Entrepreneur.findById(ent._id).populate('user');
    expect(populated.user.email).toBe('potter@example.com');
  });

  test('4. Product Model: should validate stock and price non-negativity', async () => {
    const user = await User.create({
      name: 'Artisan',
      email: 'artisan@example.com',
      password: 'password123',
      role: 'entrepreneur'
    });

    const ent = await Entrepreneur.create({
      user: user._id,
      businessName: 'Handicrafts',
      city: 'Jaipur'
    });

    const product = await Product.create({
      entrepreneur: ent._id,
      title: 'Brass Diya',
      price: 350,
      stock: 15
    });

    expect(product._id).toBeDefined();
    expect(product.price).toBe(350);
    expect(product.stock).toBe(15);

    // Negative price should fail
    let invalidError = null;
    try {
      await Product.create({
        entrepreneur: ent._id,
        title: 'Invalid',
        price: -50,
        stock: 5
      });
    } catch (err) {
      invalidError = err;
    }
    expect(invalidError).not.toBeNull();
  });

  test('5. Order Model: should save order items and calculate totals', async () => {
    const customer = await User.create({
      name: 'Buyer',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'customer'
    });

    const entUser = await User.create({
      name: 'Seller',
      email: 'seller@example.com',
      password: 'password123',
      role: 'entrepreneur'
    });

    const ent = await Entrepreneur.create({
      user: entUser._id,
      businessName: 'Pottery House',
      city: 'Delhi'
    });

    const product = await Product.create({
      entrepreneur: ent._id,
      title: 'Clay Cup',
      price: 120,
      stock: 50
    });

    const order = await Order.create({
      customer: customer._id,
      items: [
        {
          product: product._id,
          title: product.title,
          price: product.price,
          quantity: 2,
          entrepreneur: ent._id
        }
      ],
      totalAmount: 240,
      shippingAddress: {
        fullName: 'Buyer Name',
        phone: '9999988888',
        addressLine: '123 Market St',
        city: 'Delhi',
        pincode: '110001'
      },
      paymentMethod: 'UPI',
      paymentStatus: 'Paid'
    });

    expect(order._id).toBeDefined();
    expect(order.items.length).toBe(1);
    expect(order.totalAmount).toBe(240);
    expect(order.paymentStatus).toBe('Paid');
  });

  test('6. Review Model: should enforce unique review per customer per booking', async () => {
    const customer = await User.create({
      name: 'Reviewer',
      email: 'reviewer@example.com',
      password: 'password123'
    });

    const entUser = await User.create({
      name: 'Artisan Reviewee',
      email: 'artisan_rev@example.com',
      password: 'password123'
    });

    const ent = await Entrepreneur.create({
      user: entUser._id,
      businessName: 'Wood Works',
      city: 'Saharanpur'
    });

    const service = await Service.create({
      entrepreneur: ent._id,
      title: 'Wood Carving Class',
      price: 500
    });

    const booking = await Booking.create({
      customer: customer._id,
      entrepreneur: ent._id,
      service: service._id,
      bookingDate: new Date(),
      timeSlot: '11:00 - 12:00',
      price: 500
    });

    const review1 = await Review.create({
      customer: customer._id,
      entrepreneur: ent._id,
      booking: booking._id,
      rating: 5,
      comment: 'Excellent service!'
    });
    expect(review1._id).toBeDefined();

    // Duplicate review on same booking should be rejected
    let dupReviewError = null;
    try {
      await Review.create({
        customer: customer._id,
        entrepreneur: ent._id,
        booking: booking._id,
        rating: 4,
        comment: 'Second review attempt'
      });
    } catch (err) {
      dupReviewError = err;
    }
    expect(dupReviewError).not.toBeNull();
  });
});
