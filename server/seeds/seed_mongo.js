require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { connectMongo, disconnectMongo } = require('../config/mongoose');
const {
  User,
  Category,
  Entrepreneur,
  Product,
  Service,
  Order,
  Booking,
  Review,
  Notification
} = require('../models');

let memoryServer = null;

async function seedMongoDB() {
  console.log('🍃 Starting HunarHub MongoDB Seed...');
  
  try {
    const isMemory = process.argv.includes('--memory') || process.env.USE_MEMORY_MONGO === 'true';
    if (isMemory) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      console.log('⚡ Using in-memory MongoDB instance for validation:', memUri);
      await connectMongo(memUri);
    } else {
      await connectMongo();
    }

    // Clean existing records
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Entrepreneur.deleteMany({}),
      Product.deleteMany({}),
      Service.deleteMany({}),
      Order.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🧹 Cleared existing MongoDB collections.');

    // 1. Seed Categories
    const categoriesData = [
      { name: 'Pottery & Ceramics', slug: 'pottery-ceramics', description: 'Handcrafted clay, terracotta, and ceramic artworks.', icon: 'bi-cup-hot', type: 'both' },
      { name: 'Handloom & Textiles', slug: 'handloom-textiles', description: 'Handwoven fabrics, sarees, and traditional embroidery.', icon: 'bi-scissors', type: 'both' },
      { name: 'Wood & Metal Craft', slug: 'wood-metal-craft', description: 'Carved wooden goods, brassware, and metal artistry.', icon: 'bi-hammer', type: 'both' },
      { name: 'Organic & Agro Products', slug: 'organic-agro', description: 'Farm-fresh spices, raw honey, and natural heritage foods.', icon: 'bi-flower1', type: 'product' },
      { name: 'Heritage Artisan Services', slug: 'artisan-services', description: 'Custom tailoring, restoration, workshops, and repair services.', icon: 'bi-tools', type: 'service' }
    ];
    const createdCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    createdCategories.forEach(c => { catMap[c.slug] = c; });
    console.log(`✅ Seeded ${createdCategories.length} categories.`);

    // 2. Seed Users
    // Plaintext passwords will be hashed by User pre-save hook
    const adminUser = new User({
      name: 'HunarHub Administrator',
      email: 'admin@hunarhub.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      phone: '+91 99999 00000'
    });
    await adminUser.save();

    const customerUser = new User({
      name: 'Anita Verma',
      email: 'customer@hunarhub.com',
      password: process.env.CUSTOMER_PASSWORD || 'customer123',
      role: 'customer',
      phone: '+91 98765 43210'
    });
    await customerUser.save();

    const entUser1 = new User({
      name: 'Ram Prasad Sharma',
      email: 'ramprasad@hunarhub.com',
      password: process.env.DEFAULT_PASSWORD || 'password123',
      role: 'entrepreneur',
      phone: '+91 98111 22334'
    });
    await entUser1.save();

    const entUser2 = new User({
      name: 'Meenakshi Sundaram',
      email: 'meenakshi@hunarhub.com',
      password: process.env.DEFAULT_PASSWORD || 'password123',
      role: 'entrepreneur',
      phone: '+91 94444 55667'
    });
    await entUser2.save();

    const entUser3 = new User({
      name: 'Tsering Dolma',
      email: 'tsering@hunarhub.com',
      password: process.env.DEFAULT_PASSWORD || 'password123',
      role: 'entrepreneur',
      phone: '+91 97777 88990'
    });
    await entUser3.save();
    console.log('✅ Seeded 5 core users (Admin, Customer, 3 Entrepreneurs).');

    // 3. Seed Entrepreneurs
    const entProfile1 = await Entrepreneur.create({
      user: entUser1._id,
      businessName: 'Khurja Clay & Pottery Works',
      bio: 'Third-generation clay artisan specializing in hand-painted blue pottery, porous terracotta coolers, and sustainable cookware.',
      category: catMap['pottery-ceramics']._id,
      categoryName: 'Pottery & Ceramics',
      city: 'Khurja',
      state: 'Uttar Pradesh',
      address: 'Potters Colony, GT Road',
      pincode: '203131',
      phone: entUser1.phone,
      skills: ['Wheel Throwing', 'Terracotta Firing', 'Natural Glazing'],
      isApproved: true,
      verificationStatus: 'approved',
      rating: 4.9,
      reviewCount: 24,
      totalEarnings: 38500
    });

    const entProfile2 = await Entrepreneur.create({
      user: entUser2._id,
      businessName: 'Madurai Handloom Weaves',
      bio: 'Authentic sungudi and silk weavers crafting natural dye sarees, hand-embroidered borders, and organic cotton shawls.',
      category: catMap['handloom-textiles']._id,
      categoryName: 'Handloom & Textiles',
      city: 'Madurai',
      state: 'Tamil Nadu',
      address: 'South Veli Street',
      pincode: '625001',
      phone: entUser2.phone,
      skills: ['Sungudi Weaving', 'Tie-Dye', 'Zari Work'],
      isApproved: true,
      verificationStatus: 'approved',
      rating: 4.8,
      reviewCount: 18,
      totalEarnings: 45200
    });

    const entProfile3 = await Entrepreneur.create({
      user: entUser3._id,
      businessName: 'Ladakh High-Altitude Woolens',
      bio: 'Pure pashmina and sheep wool handspinners empowering local women artisans in Leh valley.',
      category: catMap['handloom-textiles']._id,
      categoryName: 'Handloom & Textiles',
      city: 'Leh',
      state: 'Ladakh',
      address: 'Choglamsar Artisan Hub',
      pincode: '194104',
      phone: entUser3.phone,
      skills: ['Pashmina Spinning', 'Wooden Loom Weaving'],
      isApproved: false,
      verificationStatus: 'pending',
      rating: 0,
      reviewCount: 0,
      totalEarnings: 0
    });
    console.log('✅ Seeded 3 Entrepreneur profiles (2 Approved, 1 Pending).');

    // 4. Seed Products
    const productsData = [
      {
        entrepreneur: entProfile1._id,
        title: 'Handcrafted Terracotta Matka with Brass Tap',
        description: 'Eco-friendly, naturally cooling clay water pitcher fired using traditional herbal woodkilns. Holds 5 liters.',
        category: catMap['pottery-ceramics']._id,
        categoryName: 'Pottery & Ceramics',
        price: 650,
        stock: 18,
        imageUrl: '/images/pottery.jpg',
        images: ['/images/pottery.jpg'],
        isActive: true
      },
      {
        entrepreneur: entProfile1._id,
        title: 'Handmade Glazed Ceramic Dinner Plates (Set of 4)',
        description: 'Lead-free stoneware plates with subtle sea-foam glaze, microwave and dishwasher safe.',
        category: catMap['pottery-ceramics']._id,
        categoryName: 'Pottery & Ceramics',
        price: 1200,
        stock: 10,
        imageUrl: '/images/pottery.jpg',
        images: ['/images/pottery.jpg'],
        isActive: true
      },
      {
        entrepreneur: entProfile2._id,
        title: 'Pure Cotton Madurai Sungudi Saree',
        description: 'Heritage Sungudi tie-and-dye saree with traditional peacock gold zari borders in rich indigo and turmeric dye.',
        category: catMap['handloom-textiles']._id,
        categoryName: 'Handloom & Textiles',
        price: 2450,
        stock: 12,
        imageUrl: '/images/textiles.jpg',
        images: ['/images/textiles.jpg'],
        isActive: true
      },
      {
        entrepreneur: entProfile2._id,
        title: 'Hand-Embroidered Chanderi Stole',
        description: 'Feather-light Chanderi silk-cotton scarf with delicate floral hand-needle embroidery.',
        category: catMap['handloom-textiles']._id,
        categoryName: 'Handloom & Textiles',
        price: 980,
        stock: 22,
        imageUrl: '/images/textiles.jpg',
        images: ['/images/textiles.jpg'],
        isActive: true
      }
    ];
    const createdProducts = await Product.insertMany(productsData);
    console.log(`✅ Seeded ${createdProducts.length} Products.`);

    // 5. Seed Services
    const servicesData = [
      {
        entrepreneur: entProfile1._id,
        title: 'Pottery Wheel Throwing Masterclass (1-on-1)',
        description: 'Private 90-minute hands-on pottery class. Learn centering, pulling walls, and shape your own clay pot to take home.',
        category: catMap['artisan-services']._id,
        categoryName: 'Heritage Artisan Services',
        price: 750,
        durationMinutes: 90,
        imageUrl: '/images/pottery.jpg',
        isActive: true
      },
      {
        entrepreneur: entProfile2._id,
        title: 'Custom Zari Blouse & Border Embroidery',
        description: 'Send in your fabric for custom Maggam, Aari, or Zardozi hand embroidery designed to your specifications.',
        category: catMap['artisan-services']._id,
        categoryName: 'Heritage Artisan Services',
        price: 1500,
        durationMinutes: 180,
        imageUrl: '/images/textiles.jpg',
        isActive: true
      }
    ];
    const createdServices = await Service.insertMany(servicesData);
    console.log(`✅ Seeded ${createdServices.length} Services.`);

    // 6. Seed Sample Order
    const sampleOrder = await Order.create({
      customer: customerUser._id,
      items: [
        {
          product: createdProducts[0]._id,
          title: createdProducts[0].title,
          price: createdProducts[0].price,
          quantity: 2,
          entrepreneur: entProfile1._id
        }
      ],
      totalAmount: createdProducts[0].price * 2,
      shippingAddress: {
        fullName: 'Anita Verma',
        phone: '+91 98765 43210',
        addressLine: 'Flat 402, Green Valley Apartments, Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006'
      },
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      paymentDetails: {
        transactionId: 'UPI-HH-9821448',
        paidAt: new Date()
      },
      orderStatus: 'Confirmed'
    });
    console.log(`✅ Seeded sample order #${sampleOrder._id}.`);

    // 7. Seed Sample Booking
    const sampleBooking = await Booking.create({
      customer: customerUser._id,
      entrepreneur: entProfile1._id,
      service: createdServices[0]._id,
      bookingDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      timeSlot: '10:00 - 11:30',
      notes: 'Beginner session for 1 person.',
      price: createdServices[0].price,
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      status: 'Accepted',
      statusHistory: [
        { status: 'Pending', note: 'Booking requested by customer', timestamp: new Date(Date.now() - 3600000) },
        { status: 'Accepted', note: 'Accepted by Ram Prasad Sharma', timestamp: new Date() }
      ]
    });
    console.log(`✅ Seeded sample booking #${sampleBooking._id}.`);

    // 8. Seed Sample Review
    await Review.create({
      customer: customerUser._id,
      entrepreneur: entProfile1._id,
      product: createdProducts[0]._id,
      rating: 5,
      comment: 'Superb craftsmanship! The clay water pot keeps water delightfully cool without any chemical taste.'
    });

    // 9. Seed Sample Notification
    await Notification.create({
      user: customerUser._id,
      title: 'Booking Confirmed!',
      message: 'Your Pottery Wheel Throwing Masterclass with Ram Prasad has been accepted.',
      type: 'booking',
      isRead: false,
      link: '/dashboard'
    });

    console.log('\n======================================================');
    console.log('🎉 HunarHub MongoDB Seed Completed Successfully!');
    console.log('======================================================');
    console.log('Credentials to test:');
    console.log('  Admin:        admin@hunarhub.com      / admin123');
    console.log('  Customer:     customer@hunarhub.com   / customer123');
    console.log('  Entrepreneur: ramprasad@hunarhub.com  / password123');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ MongoDB seed error:', error);
  } finally {
    await disconnectMongo();
    if (memoryServer) {
      await memoryServer.stop();
    }
  }
}

if (require.main === module) {
  seedMongoDB();
}

module.exports = seedMongoDB;
