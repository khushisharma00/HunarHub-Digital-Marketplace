const db = require('../config/db');

// Browse & Search approved entrepreneurs with filters & pagination
exports.getEntrepreneurs = async (req, res, next) => {
  try {
    const {
      q,
      category,
      city,
      skill,
      min_price,
      max_price,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let query = db('entrepreneurs')
      .leftJoin('categories', 'entrepreneurs.category_id', 'categories.id')
      .leftJoin('users', 'entrepreneurs.user_id', 'users.id')
      .where('entrepreneurs.status', 'approved');

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query = query.where(function () {
        this.where('entrepreneurs.business_name', 'like', term)
          .orWhere('entrepreneurs.skill_type', 'like', term)
          .orWhere('entrepreneurs.bio', 'like', term)
          .orWhere('entrepreneurs.city', 'like', term)
          .orWhere('entrepreneurs.area', 'like', term)
          .orWhere('categories.name', 'like', term);
      });
    }

    if (category) {
      if (!isNaN(category)) {
        query = query.where('entrepreneurs.category_id', parseInt(category, 10));
      } else {
        query = query.where('categories.slug', category.toLowerCase());
      }
    }

    if (city && city.trim() && city.toLowerCase() !== 'all') {
      query = query.whereRaw('LOWER(entrepreneurs.city) = ?', [city.trim().toLowerCase()]);
    }

    if (skill && skill.trim()) {
      query = query.where('entrepreneurs.skill_type', 'like', `%${skill.trim()}%`);
    }

    // Filter by price range based on services/products they offer
    if (min_price || max_price) {
      const minP = parseFloat(min_price) || 0;
      const maxP = parseFloat(max_price) || 9999999;
      query = query.whereIn('entrepreneurs.id', function () {
        this.select('entrepreneur_id')
          .from('services')
          .whereBetween('price', [minP, maxP])
          .union(function () {
            this.select('entrepreneur_id')
              .from('products')
              .whereBetween('price', [minP, maxP]);
          });
      });
    }

    // Count total matches
    const countQuery = query.clone().clearSelect().clearOrder().count('entrepreneurs.id as total').first();
    const totalRow = await countQuery;
    const total = totalRow ? Number(totalRow.total) : 0;

    // Sorting
    if (sort === 'rating_desc') {
      query = query.orderBy('entrepreneurs.rating_avg', 'desc');
    } else if (sort === 'experience_desc') {
      query = query.orderBy('entrepreneurs.experience_years', 'desc');
    } else if (sort === 'newest') {
      query = query.orderBy('entrepreneurs.created_at', 'desc');
    } else {
      query = query.orderBy('entrepreneurs.rating_avg', 'desc').orderBy('entrepreneurs.id', 'desc');
    }

    const entrepreneurs = await query
      .select(
        'entrepreneurs.id',
        'entrepreneurs.user_id',
        'entrepreneurs.business_name',
        'entrepreneurs.skill_type',
        'entrepreneurs.experience_years',
        'entrepreneurs.bio',
        'entrepreneurs.city',
        'entrepreneurs.area',
        'entrepreneurs.address',
        'entrepreneurs.profile_photo',
        'entrepreneurs.rating_avg',
        'entrepreneurs.rating_count',
        'entrepreneurs.created_at',
        'categories.id as category_id',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon'
      )
      .limit(limitNum)
      .offset(offset);

    // Get sample service and product price range for each
    const entrepreneurIds = entrepreneurs.map((e) => e.id);
    let priceSummaries = {};
    if (entrepreneurIds.length > 0) {
      const services = await db('services')
        .whereIn('entrepreneur_id', entrepreneurIds)
        .andWhere('is_active', true)
        .select('entrepreneur_id', 'price');

      const products = await db('products')
        .whereIn('entrepreneur_id', entrepreneurIds)
        .andWhere('is_active', true)
        .select('entrepreneur_id', 'price');

      entrepreneurIds.forEach((id) => {
        const entServices = services.filter((s) => s.entrepreneur_id === id);
        const entProducts = products.filter((p) => p.entrepreneur_id === id);
        const allPrices = [...entServices.map((s) => Number(s.price)), ...entProducts.map((p) => Number(p.price))];
        priceSummaries[id] = {
          min_price: allPrices.length > 0 ? Math.min(...allPrices) : null,
          services_count: entServices.length,
          products_count: entProducts.length
        };
      });
    }

    const enhancedEntrepreneurs = entrepreneurs.map((ent) => ({
      ...ent,
      min_price: priceSummaries[ent.id]?.min_price || null,
      services_count: priceSummaries[ent.id]?.services_count || 0,
      products_count: priceSummaries[ent.id]?.products_count || 0
    }));

    return res.json({
      success: true,
      entrepreneurs: enhancedEntrepreneurs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single entrepreneur by ID with full details, services, products, availability, reviews
exports.getEntrepreneurById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const entrepreneur = await db('entrepreneurs')
      .leftJoin('categories', 'entrepreneurs.category_id', 'categories.id')
      .leftJoin('users', 'entrepreneurs.user_id', 'users.id')
      .select(
        'entrepreneurs.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'categories.icon as category_icon',
        'users.full_name as owner_name',
        'users.email as owner_email',
        'users.phone as owner_phone'
      )
      .where('entrepreneurs.id', id)
      .first();

    if (!entrepreneur) {
      return res.status(404).json({ success: false, message: 'Entrepreneur not found' });
    }

    // Check visibility if not approved
    const isOwner = req.user && req.user.id === entrepreneur.user_id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (entrepreneur.status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'This entrepreneur profile is currently pending verification' });
    }

    // Fetch active services
    const services = await db('services')
      .where({ entrepreneur_id: id, is_active: true })
      .orderBy('price', 'asc');

    // Fetch active products
    const products = await db('products')
      .where({ entrepreneur_id: id, is_active: true })
      .orderBy('price', 'asc');

    // Fetch availability slots
    const availabilitySlots = await db('availability_slots')
      .where({ entrepreneur_id: id, is_active: true })
      .orderBy('day_of_week', 'asc');

    // Fetch reviews with customer details
    const reviews = await db('reviews')
      .leftJoin('users', 'reviews.customer_id', 'users.id')
      .select('reviews.*', 'users.full_name as customer_name', 'users.avatar as customer_avatar')
      .where('reviews.entrepreneur_id', id)
      .orderBy('reviews.created_at', 'desc')
      .limit(20);

    return res.json({
      success: true,
      entrepreneur,
      services,
      products,
      availabilitySlots,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// Authenticated entrepreneur updates profile
exports.updateProfile = async (req, res, next) => {
  try {
    const entrepreneur = await db('entrepreneurs').where({ user_id: req.user.id }).first();
    if (!entrepreneur) {
      return res.status(404).json({ success: false, message: 'Entrepreneur profile not found' });
    }

    const {
      business_name,
      category_id,
      skill_type,
      experience_years,
      bio,
      city,
      area,
      address,
      profile_photo
    } = req.body;

    const updates = {};
    if (business_name) updates.business_name = business_name.trim();
    if (category_id) updates.category_id = category_id;
    if (skill_type) updates.skill_type = skill_type.trim();
    if (experience_years !== undefined) updates.experience_years = Number(experience_years);
    if (bio !== undefined) updates.bio = bio.trim();
    if (city) updates.city = city.trim();
    if (area) updates.area = area.trim();
    if (address !== undefined) updates.address = address.trim();
    if (profile_photo) updates.profile_photo = profile_photo;
    updates.updated_at = db.fn.now();

    await db('entrepreneurs').where({ id: entrepreneur.id }).update(updates);
    const updated = await db('entrepreneurs').where({ id: entrepreneur.id }).first();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      entrepreneur: updated
    });
  } catch (error) {
    next(error);
  }
};
