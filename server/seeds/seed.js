require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const initDatabase = require('../config/initDb');

async function seed() {
  console.log('🌱 Starting HunarHub seed process...');

  await initDatabase();

  const defaultPassword = process.env.DEFAULT_PASSWORD || 'password123';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  // Clear existing data cleanly in reverse foreign key order
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

  console.log('🧹 Existing tables cleared.');

  // 1. Seed Core Categories
  const categoriesData = [
    {
      name: 'Cobbler',
      slug: 'cobbler',
      description: 'Expert traditional cobblers for shoe repairs, leather restoration, sole resoling, and bespoke footwear.',
      icon: 'Wrench'
    },
    {
      name: 'Potter (Kumhar)',
      slug: 'potter-kumhar',
      description: 'Skilled potters crafting terracotta vases, clay cookware, earthen water pots (matka), and festive diyas.',
      icon: 'Sparkles'
    },
    {
      name: 'Tailor',
      slug: 'tailor',
      description: 'Experienced master tailors for custom dressmaking, alterations, bridal stitching, and traditional embroidery.',
      icon: 'Scissors'
    },
    {
      name: 'Artisan',
      slug: 'artisan',
      description: 'Indigenous artisans specializing in hand-carved woodcraft, blue pottery, paintings, brass, and handloom.',
      icon: 'Palette'
    },
    {
      name: 'Small vendor',
      slug: 'small-vendor',
      description: 'Neighborhood micro-vendors offering handmade crafts, festive decorations, incense, and local specialties.',
      icon: 'ShoppingBag'
    }
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const [id] = await db('categories').insert(cat);
    categoryMap[cat.slug] = id;
  }
  console.log(`✅ Seeded ${categoriesData.length} core categories.`);

  // 2. Seed Admin User
  const [adminId] = await db('users').insert({
    full_name: 'HunarHub Admin',
    email: 'admin@hunarhub.com',
    password_hash: adminPasswordHash,
    role: 'admin',
    phone: '+91 98765 43210'
  });

  // 3. Seed Demo Customer
  const [customerId] = await db('users').insert({
    full_name: 'Ananya Deshmukh',
    email: 'customer@hunarhub.com',
    password_hash: defaultPasswordHash,
    role: 'customer',
    phone: '+91 91234 56789'
  });

  // Second demo customer
  const [customer2Id] = await db('users').insert({
    full_name: 'Rahul Sen',
    email: 'rahul@hunarhub.com',
    password_hash: defaultPasswordHash,
    role: 'customer',
    phone: '+91 92345 67890'
  });

  console.log('✅ Seeded Admin and Demo Customer accounts.');

  // 4. Seed 15 Realistic Micro-Entrepreneurs
  const entrepreneursData = [
    {
      name: 'Ramprasad Prajapati',
      email: 'ramprasad@hunarhub.com',
      phone: '+91 98290 11001',
      category_slug: 'potter-kumhar',
      business_name: 'Kashi Terracotta & Clay Crafts',
      skill_type: 'Master Potter & Terracotta Sculptor',
      experience_years: 28,
      bio: 'Third-generation traditional potter from Varanasi. Specializing in organic Mitti ke Bartan (clay cookware), matkas, planters, and ornamental terracotta sculptures baked in wood-fire kilns.',
      city: 'Varanasi',
      area: 'Assi Ghat',
      address: 'Lane 4, Near Assi Ghat Pottery Market',
      profile_photo: '/images/pottery.jpg',
      status: 'approved',
      rating_avg: 4.9,
      rating_count: 24
    },
    {
      name: 'Shyam Lal',
      email: 'shyamlal@hunarhub.com',
      phone: '+91 98290 11002',
      category_slug: 'cobbler',
      business_name: 'Lal Leathercraft & Boot Repairs',
      skill_type: 'Master Cobbler & Leather Care Specialist',
      experience_years: 22,
      bio: 'Master cobbler skilled in genuine leather sole stitching, heel replacements, zipper repairs, and bespoke handmade leather sandals (kolhapuris).',
      city: 'Lucknow',
      area: 'Aminabad',
      address: 'Shop 14, Cobblers Alley, Aminabad Market',
      profile_photo: '/images/hero.jpg',
      status: 'approved',
      rating_avg: 4.8,
      rating_count: 19
    },
    {
      name: 'Meera Sharma',
      email: 'meera@hunarhub.com',
      phone: '+91 98290 11003',
      category_slug: 'tailor',
      business_name: 'Meera Boutique & Custom Alterations',
      skill_type: 'Master Dressmaker & Gota-Patti Specialist',
      experience_years: 15,
      bio: 'Expert in women ethnic wear, precise suit alterations, blouse tailoring with padding, and traditional Rajasthani Gota Patti border stitching.',
      city: 'Jaipur',
      area: 'Johari Bazaar',
      address: 'B-12, Heritage Arcade, Johari Bazaar',
      profile_photo: '/images/textiles.jpg',
      status: 'approved',
      rating_avg: 4.9,
      rating_count: 32
    },
    {
      name: 'Arjun Rao',
      email: 'arjun@hunarhub.com',
      phone: '+91 98290 11004',
      category_slug: 'artisan',
      business_name: 'Rao Heritage Woodcrafts',
      skill_type: 'Sheesham & Teak Wood Carver',
      experience_years: 18,
      bio: 'Crafting fine hand-carved wooden jewellery boxes, carved wall panels, and brass-inlaid tea coasters using sustainable Sheesham and mango wood.',
      city: 'Jaipur',
      area: 'MI Road',
      address: 'Near Old Gate, MI Road Handicrafts Hub',
      profile_photo: '/images/woodcraft.jpg',
      status: 'approved',
      rating_avg: 4.7,
      rating_count: 15
    },
    {
      name: 'Lakshmi Bai',
      email: 'lakshmibai@hunarhub.com',
      phone: '+91 98290 11005',
      category_slug: 'small-vendor',
      business_name: 'Lakshmi Festive Crafts & Decor',
      skill_type: 'Festive Handicrafts & Handmade Diyas',
      experience_years: 12,
      bio: 'Creating eco-friendly cow dung diyas, handcrafted torans, brass bells, and decorative festive hampers made with recycled materials.',
      city: 'Delhi',
      area: 'Chandni Chowk',
      address: 'Kinari Bazaar, Chandni Chowk, Old Delhi',
      profile_photo: '/images/seller.jpg',
      status: 'approved',
      rating_avg: 4.6,
      rating_count: 28
    },
    {
      name: 'Santosh Kumar',
      email: 'santosh@hunarhub.com',
      phone: '+91 98290 11006',
      category_slug: 'cobbler',
      business_name: 'City Footwear Repair Center',
      skill_type: 'Shoe Resoling & Leather Dyeing',
      experience_years: 16,
      bio: 'Specialist in resoling sports sneakers, trekking boots, polishing formal Oxford shoes, and luxury handbag leather conditioning.',
      city: 'Delhi',
      area: 'Karol Bagh',
      address: 'Stall 8, Arya Samaj Road, Karol Bagh',
      profile_photo: '/images/hero.jpg',
      status: 'approved',
      rating_avg: 4.7,
      rating_count: 14
    },
    {
      name: 'Kailash Kumhar',
      email: 'kailash@hunarhub.com',
      phone: '+91 98290 11007',
      category_slug: 'potter-kumhar',
      business_name: 'Kailash Mitti Udyog',
      skill_type: 'Clay Cookware & Water Coolers',
      experience_years: 30,
      bio: 'Handcrafted pure clay biryani pots, tawa, cups (kulhad), and self-cooling natural clay water dispensers with brass taps.',
      city: 'Jaipur',
      area: 'Sanganer',
      address: 'Kumhar Mohalla, Sanganer Town',
      profile_photo: '/images/pottery.jpg',
      status: 'approved',
      rating_avg: 4.9,
      rating_count: 36
    },
    {
      name: 'Fatima Bano',
      email: 'fatima@hunarhub.com',
      phone: '+91 98290 11008',
      category_slug: 'tailor',
      business_name: 'Noor Chikankari & Zardozi Studio',
      skill_type: 'Authentic Lucknowi Chikankari Artisan',
      experience_years: 19,
      bio: 'Hand embroidery artisan delivering traditional Bakhiya, Phanda, and Tepchi stitch patterns on pure cotton and georgette fabrics.',
      city: 'Lucknow',
      area: 'Chowk',
      address: 'Phool Wali Gali, Chowk, Lucknow',
      profile_photo: '/images/textiles.jpg',
      status: 'approved',
      rating_avg: 5.0,
      rating_count: 22
    },
    {
      name: 'Govind Chitrakar',
      email: 'govind@hunarhub.com',
      phone: '+91 98290 11009',
      category_slug: 'artisan',
      business_name: 'Chitrakar Traditional Folk Art',
      skill_type: 'Madhubani & Miniature Painting Artist',
      experience_years: 25,
      bio: 'Folk artist painting authentic Madhubani, Pichwai, and Pattachitra artworks on handmade paper, canvas scrolls, and silk stoles.',
      city: 'Varanasi',
      area: 'Dashashwamedh',
      address: 'Artisan Corner, Dashashwamedh Ghat Road',
      profile_photo: '/images/painting.jpg',
      status: 'approved',
      rating_avg: 4.9,
      rating_count: 18
    },
    {
      name: 'Sunita Devi',
      email: 'sunita@hunarhub.com',
      phone: '+91 98290 11010',
      category_slug: 'small-vendor',
      business_name: 'Sunita Homemade Spices & Masalas',
      skill_type: 'Stone-Ground Spices & Traditional Pickles',
      experience_years: 14,
      bio: 'Micro-vendor crafting sun-dried mango pickles, garlic chutney powders, and hand-pounded organic garam masala without preservatives.',
      city: 'Mumbai',
      area: 'Dadar',
      address: 'Near Plaza Cinema, Dadar West',
      profile_photo: '/images/seller.jpg',
      status: 'approved',
      rating_avg: 4.8,
      rating_count: 27
    },
    {
      name: 'Devendra Verma',
      email: 'devendra@hunarhub.com',
      phone: '+91 98290 11011',
      category_slug: 'cobbler',
      business_name: 'Verma Handcrafted Shoes',
      skill_type: 'Handmade Leather Shoes & Mojaris',
      experience_years: 20,
      bio: 'Preserving the heritage of Agra shoemaking. Hand-cut buffalo and goat leather shoes, juttis, and durable work boots.',
      city: 'Agra',
      area: 'Sadar Bazaar',
      address: 'Shop 22, Shoe Market, Sadar Bazaar',
      profile_photo: '/images/hero.jpg',
      status: 'approved',
      rating_avg: 4.7,
      rating_count: 13
    },
    {
      name: 'Geeta Prajapati',
      email: 'geeta@hunarhub.com',
      phone: '+91 98290 11012',
      category_slug: 'artisan',
      business_name: 'Jaipur Blue Pottery Studio',
      skill_type: 'Traditional Blue Pottery Craftsman',
      experience_years: 11,
      bio: 'Crafting GI-tagged Jaipur Blue Pottery tiles, tableware, bowls, and door knobs painted with cobalt oxide blue and green motifs.',
      city: 'Jaipur',
      area: 'Amer',
      address: 'Amer Road Pottery Colony, Jaipur',
      profile_photo: '/images/jewellery.jpg',
      status: 'approved',
      rating_avg: 4.9,
      rating_count: 29
    },
    {
      name: 'Naseem Akhtar',
      email: 'naseem@hunarhub.com',
      phone: '+91 98290 11013',
      category_slug: 'tailor',
      business_name: 'Akhtar Royal Tailoring',
      skill_type: 'Men Bespoke Tailor (Kurta & Sherwani)',
      experience_years: 24,
      bio: 'Specialist in custom men sherwanis, bandhgalas, Nehru jackets, and precision alterations for vintage woollen coats.',
      city: 'Delhi',
      area: 'Old Delhi',
      address: 'Near Jama Masjid Gate 1, Old Delhi',
      profile_photo: '/images/textiles.jpg',
      status: 'approved',
      rating_avg: 4.8,
      rating_count: 16
    },
    {
      name: 'Rameshwar Prasad',
      email: 'rameshwar@hunarhub.com',
      phone: '+91 98290 11014',
      category_slug: 'artisan',
      business_name: 'Kashi Brass & Bell Metal Works',
      skill_type: 'Brass & Bronze Handicrafts Metalworker',
      experience_years: 26,
      bio: 'Hand-beaten brass pooja thalis, temple bells, diya stands, and antique finish decorative figurines from the historic metal lanes of Kashi.',
      city: 'Varanasi',
      area: 'Thatheri Bazaar',
      address: 'Thatheri Bazaar Main Gali, Varanasi',
      profile_photo: '/images/about.jpg',
      status: 'approved',
      rating_avg: 4.8,
      rating_count: 11
    },
    {
      name: 'Pushpa Rawat',
      email: 'pushpa@hunarhub.com',
      phone: '+91 98290 11015',
      category_slug: 'small-vendor',
      business_name: 'Pushpa Herbal & Aromatic Crafts',
      skill_type: 'Natural Incense & Herbal Soaps',
      experience_years: 8,
      bio: 'Hand-rolled chemical-free charcoal-less incense sticks (agarbatti), cold-pressed neem and turmeric herbal soaps, and natural camphor cones.',
      city: 'Mumbai',
      area: 'Bandra',
      address: 'Pali Village Market, Bandra West',
      profile_photo: '/images/seller.jpg',
      status: 'pending', // Demo pending verification for admin approval testing!
      rating_avg: 0.0,
      rating_count: 0
    }
  ];

  const entrepreneurIdMap = {};

  for (const ent of entrepreneursData) {
    const [userId] = await db('users').insert({
      full_name: ent.name,
      email: ent.email,
      password_hash: defaultPasswordHash,
      role: 'entrepreneur',
      phone: ent.phone
    });

    const [entId] = await db('entrepreneurs').insert({
      user_id: userId,
      category_id: categoryMap[ent.category_slug],
      business_name: ent.business_name,
      skill_type: ent.skill_type,
      experience_years: ent.experience_years,
      bio: ent.bio,
      city: ent.city,
      area: ent.area,
      address: ent.address,
      profile_photo: ent.profile_photo,
      status: ent.status,
      rating_avg: ent.rating_avg,
      rating_count: ent.rating_count
    });

    entrepreneurIdMap[ent.email] = { id: entId, userId, ...ent };
  }
  console.log(`✅ Seeded ${entrepreneursData.length} micro-entrepreneurs.`);

  // 5. Seed Services for Entrepreneurs
  const servicesData = [
    // Ramprasad Prajapati (Potter)
    {
      entEmail: 'ramprasad@hunarhub.com',
      category: 'potter-kumhar',
      title: 'Custom Terracotta Planter Creation',
      description: 'Handcrafted custom size terracotta garden planter crafted to your specific dimensions and design.',
      price: 350.00,
      duration_mins: 90
    },
    {
      entEmail: 'ramprasad@hunarhub.com',
      category: 'potter-kumhar',
      title: 'Pottery Wheel Demonstration & Workshop',
      description: '1-on-1 private lesson on the traditional pottery wheel with raw clay provided.',
      price: 500.00,
      duration_mins: 60
    },
    // Shyam Lal (Cobbler)
    {
      entEmail: 'shyamlal@hunarhub.com',
      category: 'cobbler',
      title: 'Full Leather Sole Resoling & Stitching',
      description: 'Hand-stitched leather sole replacement with heavy-duty thread and rubber heel grip.',
      price: 280.00,
      duration_mins: 60
    },
    {
      entEmail: 'shyamlal@hunarhub.com',
      category: 'cobbler',
      title: 'Sneaker Repair & Sole Bonding',
      description: 'Industrial shoe cement re-gluing and reinforcement stitching for running and casual shoes.',
      price: 150.00,
      duration_mins: 45
    },
    {
      entEmail: 'shyamlal@hunarhub.com',
      category: 'cobbler',
      title: 'Leather Bag Zipper & Strap Replacement',
      description: 'Repairing or replacing worn zippers, brass buckles, and broken handles on leather luggage and bags.',
      price: 220.00,
      duration_mins: 60
    },
    // Meera Sharma (Tailor)
    {
      entEmail: 'meera@hunarhub.com',
      category: 'tailor',
      title: 'Designer Blouse Tailoring (with Padding)',
      description: 'Custom stitched designer saree blouse with custom neckline, cups, and piping.',
      price: 650.00,
      duration_mins: 120
    },
    {
      entEmail: 'meera@hunarhub.com',
      category: 'tailor',
      title: 'Full Kurti / Salwar Suit Stitching',
      description: 'Complete custom tailoring from unstitched dress material with customized fitting.',
      price: 550.00,
      duration_mins: 120
    },
    {
      entEmail: 'meera@hunarhub.com',
      category: 'tailor',
      title: 'Express Dress Alteration & Hemming',
      description: 'Waist shortening, sleeve shortening, and side seam adjustments for existing garments.',
      price: 120.00,
      duration_mins: 30
    },
    // Arjun Rao (Artisan)
    {
      entEmail: 'arjun@hunarhub.com',
      category: 'artisan',
      title: 'Antique Wood Furniture Restoration & Polish',
      description: 'Hand French polish, scratch buffing, and structural re-jointing for wooden heirlooms.',
      price: 850.00,
      duration_mins: 150
    },
    {
      entEmail: 'arjun@hunarhub.com',
      category: 'artisan',
      title: 'Custom Nameplate Wood Carving',
      description: 'Teak wood door nameplate with hand-carved floral border and personalized brass lettering.',
      price: 699.00,
      duration_mins: 90
    },
    // Santosh Kumar (Cobbler)
    {
      entEmail: 'santosh@hunarhub.com',
      category: 'cobbler',
      title: 'Formal Shoe Mirror Shine Polishing',
      description: 'Deep saddle soap cleaning followed by 5 layers of saphir wax mirror shine.',
      price: 180.00,
      duration_mins: 40
    },
    // Kailash Kumhar (Potter)
    {
      entEmail: 'kailash@hunarhub.com',
      category: 'potter-kumhar',
      title: 'Bulk Wedding Kulhad & Earthen Matka Supply',
      description: 'Custom batch preparation of 100 eco-friendly clay chai kulhads for events.',
      price: 450.00,
      duration_mins: 180
    },
    // Fatima Bano (Tailor)
    {
      entEmail: 'fatima@hunarhub.com',
      category: 'tailor',
      title: 'Custom Chikankari Neckline Embroidery',
      description: 'Hand-stitched authentic shadow work and murri embroidery on customer fabric.',
      price: 950.00,
      duration_mins: 180
    },
    // Naseem Akhtar (Tailor)
    {
      entEmail: 'naseem@hunarhub.com',
      category: 'tailor',
      title: 'Nehru Jacket Bespoke Tailoring',
      description: 'Hand-tailored Modi/Nehru waistcoat jacket with silk lining and welt pockets.',
      price: 890.00,
      duration_mins: 150
    },
    // Govind Chitrakar (Artisan)
    {
      entEmail: 'govind@hunarhub.com',
      category: 'artisan',
      title: 'Custom Portrait in Indian Miniature Style',
      description: 'Handmade portrait painted using natural stone pigments on vintage handmade paper.',
      price: 1800.00,
      duration_mins: 240
    }
  ];

  const serviceIdList = [];
  for (const s of servicesData) {
    const ent = entrepreneurIdMap[s.entEmail];
    if (ent) {
      const [sId] = await db('services').insert({
        entrepreneur_id: ent.id,
        category_id: categoryMap[s.category],
        title: s.title,
        description: s.description,
        price: s.price,
        duration_mins: s.duration_mins,
        is_active: true
      });
      serviceIdList.push({ id: sId, entId: ent.id, title: s.title, price: s.price });
    }
  }
  console.log(`✅ Seeded ${serviceIdList.length} services.`);

  // 6. Seed Handmade Products
  const productsData = [
    // Ramprasad Prajapati
    {
      entEmail: 'ramprasad@hunarhub.com',
      category: 'potter-kumhar',
      name: 'Hand-Painted Terracotta Flower Vase',
      description: 'Traditional earthen vase with geometric folk motifs, ideal for dry floral arrangements and living rooms.',
      price: 380.00,
      stock: 14,
      image_url: '/images/pottery.jpg'
    },
    {
      entEmail: 'ramprasad@hunarhub.com',
      category: 'potter-kumhar',
      name: 'Natural Clay Water Matka with Brass Tap (5L)',
      description: 'Unglazed porous red clay pot that cools drinking water naturally without electricity.',
      price: 499.00,
      stock: 8,
      image_url: '/images/pottery.jpg'
    },
    {
      entEmail: 'ramprasad@hunarhub.com',
      category: 'potter-kumhar',
      name: 'Set of 6 Terracotta Chai Kulhads',
      description: 'Reusable clay cups that give authentic earthy aroma to hot tea and filter coffee.',
      price: 180.00,
      stock: 25,
      image_url: '/images/pottery.jpg'
    },
    // Shyam Lal
    {
      entEmail: 'shyamlal@hunarhub.com',
      category: 'cobbler',
      name: 'Handcrafted Buffalo Leather Kolhapuri Chappal',
      description: 'Genuine vegetable-tanned leather sandals with braided thong and cushioned footbed.',
      price: 650.00,
      stock: 12,
      image_url: '/images/hero.jpg'
    },
    {
      entEmail: 'shyamlal@hunarhub.com',
      category: 'cobbler',
      name: 'Waxed Thread Shoe Repair Emergency Kit',
      description: 'Heavy duty sewing awl, 3 needles, and 20m of waxed nylon cord for shoe stitching.',
      price: 199.00,
      stock: 20,
      image_url: '/images/hero.jpg'
    },
    // Meera Sharma
    {
      entEmail: 'meera@hunarhub.com',
      category: 'tailor',
      name: 'Hand-Embroidered Bandhani Silk Stole',
      description: 'Traditional tie-and-dye pure silk dupatta with gold zari borders and tassels.',
      price: 850.00,
      stock: 9,
      image_url: '/images/textiles.jpg'
    },
    {
      entEmail: 'meera@hunarhub.com',
      category: 'tailor',
      name: 'Upcycled Fabric Patchwork Tote Bag',
      description: 'Eco-friendly double-layered cotton tote bag made from artisan surplus fabric remnants.',
      price: 240.00,
      stock: 18,
      image_url: '/images/textiles.jpg'
    },
    // Arjun Rao
    {
      entEmail: 'arjun@hunarhub.com',
      category: 'artisan',
      name: 'Hand-Carved Sheesham Wooden Jewellery Box',
      description: 'Velvet-lined wooden trinket box with brass latch and intricate floral lattice carving.',
      price: 799.00,
      stock: 11,
      image_url: '/images/woodcraft.jpg'
    },
    {
      entEmail: 'arjun@hunarhub.com',
      category: 'artisan',
      name: 'Set of 4 Brass-Inlaid Wood Coasters',
      description: 'Hand-polished rosewood drink coasters with traditional elephant inlay.',
      price: 349.00,
      stock: 15,
      image_url: '/images/woodcraft.jpg'
    },
    // Lakshmi Bai
    {
      entEmail: 'lakshmibai@hunarhub.com',
      category: 'small-vendor',
      name: 'Box of 12 Hand-Painted Festive Clay Diyas',
      description: 'Colorful earthen lamps decorated with acrylic pearls and metallic golden glitter.',
      price: 150.00,
      stock: 40,
      image_url: '/images/seller.jpg'
    },
    {
      entEmail: 'lakshmibai@hunarhub.com',
      category: 'small-vendor',
      name: 'Handmade Marigold & Mango Leaf Door Toran',
      description: 'Traditional entryway festive hanging made with fabric florals and golden ghungroos.',
      price: 280.00,
      stock: 16,
      image_url: '/images/seller.jpg'
    },
    // Kailash Kumhar
    {
      entEmail: 'kailash@hunarhub.com',
      category: 'potter-kumhar',
      name: 'Organic Clay Biryani Handi with Lid (2L)',
      description: 'Slow-cooking earthen pot suitable for low flame cooking, preserving vital nutrients.',
      price: 420.00,
      stock: 10,
      image_url: '/images/pottery.jpg'
    },
    {
      entEmail: 'kailash@hunarhub.com',
      category: 'potter-kumhar',
      name: 'Traditional Clay Curd Setter Pot (Dahi Handi)',
      description: 'Absorbs excess moisture to produce thick, naturally sweet homemade curd.',
      price: 190.00,
      stock: 22,
      image_url: '/images/pottery.jpg'
    },
    // Fatima Bano
    {
      entEmail: 'fatima@hunarhub.com',
      category: 'tailor',
      name: 'Pure Cotton Hand-Chikan Embroidered Kurta',
      description: 'Breezy summer white-on-white chikankari kurta with intricate paisley motifs.',
      price: 1250.00,
      stock: 7,
      image_url: '/images/textiles.jpg'
    },
    // Govind Chitrakar
    {
      entEmail: 'govind@hunarhub.com',
      category: 'artisan',
      name: 'Framed Madhubani Tree of Life Painting (12x16")',
      description: 'Authentic handmade Mithila artwork depicting peacocks and blooming flora.',
      price: 1450.00,
      stock: 4,
      image_url: '/images/painting.jpg'
    },
    // Sunita Devi
    {
      entEmail: 'sunita@hunarhub.com',
      category: 'small-vendor',
      name: 'Traditional Sun-Dried Stuffed Red Chilli Pickle (400g)',
      description: 'Authentic Banarasi Bharwa Lal Mirch made in pure mustard oil and ground spices.',
      price: 220.00,
      stock: 30,
      image_url: '/images/seller.jpg'
    },
    {
      entEmail: 'sunita@hunarhub.com',
      category: 'small-vendor',
      name: 'Hand-Pounded Shahi Garam Masala (200g)',
      description: 'Blend of 18 whole spices stone-ground in small batches without fillers.',
      price: 190.00,
      stock: 25,
      image_url: '/images/seller.jpg'
    },
    // Geeta Prajapati
    {
      entEmail: 'geeta@hunarhub.com',
      category: 'artisan',
      name: 'Handmade Jaipur Blue Pottery Serving Bowl',
      description: 'Cobalt blue and turquoise glazed quartz bowl featuring mughal floral motifs.',
      price: 520.00,
      stock: 14,
      image_url: '/images/jewellery.jpg'
    },
    {
      entEmail: 'geeta@hunarhub.com',
      category: 'artisan',
      name: 'Set of 4 Blue Pottery Ceramic Drawer Knobs',
      description: 'Handcrafted cabinet pulls with antique brass fittings.',
      price: 360.00,
      stock: 18,
      image_url: '/images/jewellery.jpg'
    },
    // Devendra Verma
    {
      entEmail: 'devendra@hunarhub.com',
      category: 'cobbler',
      name: 'Classic Men Hand-Stitched Leather Belt (Tan)',
      description: 'Full-grain 1.5 inch thick genuine leather belt with solid brass buckle.',
      price: 499.00,
      stock: 15,
      image_url: '/images/hero.jpg'
    },
    // Rameshwar Prasad
    {
      entEmail: 'rameshwar@hunarhub.com',
      category: 'artisan',
      name: 'Hand-Hammered Pure Brass Pooja Thali Set',
      description: 'Complete 7-piece set including diya, bell, chandan cup, and kumkum holder.',
      price: 1199.00,
      stock: 6,
      image_url: '/images/about.jpg'
    },
    // Pushpa Rawat
    {
      entEmail: 'pushpa@hunarhub.com',
      category: 'small-vendor',
      name: 'Handmade Vetiver & Neem Cold-Pressed Soap (100g)',
      description: 'Nourishing herbal bar made with virgin coconut oil and organic herbs.',
      price: 110.00,
      stock: 45,
      image_url: '/images/seller.jpg'
    }
  ];

  const productIdList = [];
  for (const p of productsData) {
    const ent = entrepreneurIdMap[p.entEmail];
    if (ent) {
      const [pId] = await db('products').insert({
        entrepreneur_id: ent.id,
        category_id: categoryMap[p.category],
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image_url: p.image_url,
        is_active: true
      });
      productIdList.push({ id: pId, entId: ent.id, name: p.name, price: p.price, stock: p.stock });
    }
  }
  console.log(`✅ Seeded ${productIdList.length} handmade products.`);

  // 7. Seed Availability Slots for Entrepreneurs
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const times = [
    { start: '10:00', end: '11:00' },
    { start: '11:30', end: '12:30' },
    { start: '14:00', end: '15:00' },
    { start: '15:30', end: '16:30' },
    { start: '17:00', end: '18:00' }
  ];

  for (const entEmail of Object.keys(entrepreneurIdMap)) {
    const ent = entrepreneurIdMap[entEmail];
    for (const day of days) {
      for (const t of times.slice(0, 3)) {
        await db('availability_slots').insert({
          entrepreneur_id: ent.id,
          day_of_week: day,
          start_time: t.start,
          end_time: t.end,
          is_active: true
        });
      }
    }
  }
  console.log('✅ Seeded availability slots for all micro-entrepreneurs.');

  // 8. Seed Sample Service Requests with Multiple Statuses
  const sampleRequests = [
    {
      customer_id: customerId,
      entEmail: 'ramprasad@hunarhub.com',
      serviceIdx: 0,
      booking_date: '2026-10-18',
      time_slot: '10:00 - 11:00',
      status: 'Completed',
      notes: 'Terracotta planter for my balcony garden',
      address: '74/A, Ganga View Apartments, Varanasi'
    },
    {
      customer_id: customerId,
      entEmail: 'shyamlal@hunarhub.com',
      serviceIdx: 2,
      booking_date: '2026-10-20',
      time_slot: '14:00 - 15:00',
      status: 'In progress',
      notes: 'Leather briefcase zipper needs repair',
      address: 'Flat 302, Hazratganj, Lucknow'
    },
    {
      customer_id: customerId,
      entEmail: 'meera@hunarhub.com',
      serviceIdx: 5,
      booking_date: '2026-10-22',
      time_slot: '11:30 - 12:30',
      status: 'Accepted',
      notes: 'Festive lehenga blouse stitching',
      address: '15, C-Scheme, Jaipur'
    },
    {
      customer_id: customer2Id,
      entEmail: 'arjun@hunarhub.com',
      serviceIdx: 8,
      booking_date: '2026-10-25',
      time_slot: '15:30 - 16:30',
      status: 'Pending',
      notes: 'Need antique dining table polished',
      address: '22, Raja Park, Jaipur'
    }
  ];

  const serviceRequestIds = [];
  for (const sr of sampleRequests) {
    const ent = entrepreneurIdMap[sr.entEmail];
    const srv = serviceIdList.find((s) => s.entId === ent.id);
    if (srv) {
      const [reqId] = await db('service_requests').insert({
        customer_id: sr.customer_id,
        entrepreneur_id: ent.id,
        service_id: srv.id,
        booking_date: sr.booking_date,
        time_slot: sr.time_slot,
        address: sr.address,
        notes: sr.notes,
        total_price: srv.price,
        status: sr.status,
        payment_method: 'Pay on service completion',
        payment_status: sr.status === 'Completed' ? 'Paid' : 'Pending'
      });

      serviceRequestIds.push({ id: reqId, status: sr.status, entId: ent.id, customer_id: sr.customer_id });

      await db('status_history').insert({
        entity_type: 'service_request',
        entity_id: reqId,
        previous_status: null,
        new_status: sr.status,
        changed_by_user_id: sr.customer_id,
        notes: 'Initial seed request created'
      });
    }
  }
  console.log(`✅ Seeded ${serviceRequestIds.length} sample service requests.`);

  // 9. Seed Sample Orders with Multiple Statuses
  const sampleOrders = [
    {
      customer_id: customerId,
      status: 'Completed',
      items: [
        { prodIdx: 0, qty: 1 }, // Terracotta Vase
        { prodIdx: 2, qty: 2 }  // Set of 6 Chai Kulhads
      ],
      delivery_address: '74/A, Ganga View Apartments, Varanasi',
      contact_phone: '+91 91234 56789'
    },
    {
      customer_id: customerId,
      status: 'Confirmed',
      items: [
        { prodIdx: 7, qty: 1 }  // Sheesham Jewellery Box
      ],
      delivery_address: '74/A, Ganga View Apartments, Varanasi',
      contact_phone: '+91 91234 56789'
    },
    {
      customer_id: customer2Id,
      status: 'Placed',
      items: [
        { prodIdx: 9, qty: 2 }  // Box of 12 Diyas
      ],
      delivery_address: 'B-4, Model Town, Delhi',
      contact_phone: '+91 92345 67890'
    }
  ];

  const orderIds = [];
  for (const so of sampleOrders) {
    let totalAmt = 0;
    const resolvedItems = [];
    for (const it of so.items) {
      const prod = productIdList[it.prodIdx];
      if (prod) {
        const itemTotal = prod.price * it.qty;
        totalAmt += itemTotal;
        resolvedItems.push({
          product_id: prod.id,
          entrepreneur_id: prod.entId,
          quantity: it.qty,
          unit_price: prod.price,
          total_price: itemTotal
        });
      }
    }

    const [ordId] = await db('orders').insert({
      customer_id: so.customer_id,
      total_amount: totalAmt,
      status: so.status,
      delivery_address: so.delivery_address,
      contact_phone: so.contact_phone,
      payment_method: 'Pay on delivery',
      payment_status: so.status === 'Completed' ? 'Paid' : 'Pending'
    });

    for (const rItem of resolvedItems) {
      await db('order_items').insert({
        order_id: ordId,
        product_id: rItem.product_id,
        entrepreneur_id: rItem.entrepreneur_id,
        quantity: rItem.quantity,
        unit_price: rItem.unit_price,
        total_price: rItem.total_price
      });
    }

    await db('status_history').insert({
      entity_type: 'order',
      entity_id: ordId,
      previous_status: null,
      new_status: so.status,
      changed_by_user_id: so.customer_id,
      notes: 'Initial seed order placed'
    });

    orderIds.push({ id: ordId, status: so.status, customer_id: so.customer_id, totalAmt });
  }
  console.log(`✅ Seeded ${orderIds.length} sample orders.`);

  // 10. Seed Reviews on Completed Service Request and Order
  const completedRequest = serviceRequestIds.find((r) => r.status === 'Completed');
  if (completedRequest) {
    await db('reviews').insert({
      customer_id: completedRequest.customer_id,
      entrepreneur_id: completedRequest.entId,
      service_request_id: completedRequest.id,
      rating: 5,
      comment: 'Ramprasad ji made an exquisite custom planter! Exceptional clay finish and fast delivery. Highly recommended.'
    });
  }

  const completedOrder = orderIds.find((o) => o.status === 'Completed');
  if (completedOrder) {
    const firstItem = await db('order_items').where({ order_id: completedOrder.id }).first();
    if (firstItem) {
      await db('reviews').insert({
        customer_id: completedOrder.customer_id,
        entrepreneur_id: firstItem.entrepreneur_id,
        order_id: completedOrder.id,
        rating: 5,
        comment: 'The terracotta kulhads arrived safely packaged in bubble wrap. Wonderful earthy fragrance when drinking tea!'
      });
    }
  }
  console.log('✅ Seeded customer reviews on completed orders & requests.');

  // 11. Seed In-App Notifications
  await db('notifications').insert([
    {
      user_id: customerId,
      title: 'Welcome to HunarHub!',
      message: 'Explore local artisans and book skilled services right from your neighborhood.',
      type: 'system',
      link: '/browse'
    },
    {
      user_id: adminId,
      title: 'New Entrepreneur Pending Verification',
      message: 'Pushpa Rawat has registered as a Small Vendor and is awaiting admin approval.',
      type: 'approval',
      link: '/admin/dashboard'
    }
  ]);
  console.log('✅ Seeded in-app notifications.');

  // 12. Seed Sample Dispute
  await db('disputes').insert({
    raised_by_user_id: customer2Id,
    against_user_id: entrepreneurIdMap['shyamlal@hunarhub.com'].userId,
    reason: 'Delayed Service Completion',
    details: 'The shoe repair was promised by Tuesday, but the workshop was closed when I visited for pickup.',
    status: 'Open'
  });
  console.log('✅ Seeded sample dispute.');

  console.log('\n🎉 HUNARHUB SEED COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('👤 Admin Login:');
  console.log('   Email:    admin@hunarhub.com');
  console.log('   Password: ' + adminPassword);
  console.log('----------------------------------------------------');
  console.log('👤 Demo Customer Login:');
  console.log('   Email:    customer@hunarhub.com');
  console.log('   Password: ' + defaultPassword);
  console.log('----------------------------------------------------');
  console.log('👤 Demo Entrepreneur Login (e.g. Ramprasad Prajapati):');
  console.log('   Email:    ramprasad@hunarhub.com');
  console.log('   Password: ' + defaultPassword);
  console.log('====================================================\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
