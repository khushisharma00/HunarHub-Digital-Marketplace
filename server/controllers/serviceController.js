const db = require('../config/db');

// List services with search and filters
exports.getServices = async (req, res, next) => {
  try {
    const { category, city, q, min_price, max_price, entrepreneur_id } = req.query;

    let query = db('services')
      .join('entrepreneurs', 'services.entrepreneur_id', 'entrepreneurs.id')
      .leftJoin('categories', 'services.category_id', 'categories.id')
      .where('services.is_active', true)
      .andWhere('entrepreneurs.status', 'approved');

    if (entrepreneur_id) {
      query = query.andWhere('services.entrepreneur_id', entrepreneur_id);
    }

    if (category) {
      if (!isNaN(category)) {
        query = query.andWhere('services.category_id', parseInt(category, 10));
      } else {
        query = query.andWhere('categories.slug', category.toLowerCase());
      }
    }

    if (city && city.trim() && city.toLowerCase() !== 'all') {
      query = query.whereRaw('LOWER(entrepreneurs.city) = ?', [city.trim().toLowerCase()]);
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query = query.where(function () {
        this.where('services.title', 'like', term)
          .orWhere('services.description', 'like', term)
          .orWhere('entrepreneurs.business_name', 'like', term);
      });
    }

    if (min_price) {
      query = query.andWhere('services.price', '>=', parseFloat(min_price));
    }
    if (max_price) {
      query = query.andWhere('services.price', '<=', parseFloat(max_price));
    }

    const services = await query
      .select(
        'services.*',
        'entrepreneurs.business_name as entrepreneur_name',
        'entrepreneurs.city as entrepreneur_city',
        'entrepreneurs.area as entrepreneur_area',
        'entrepreneurs.rating_avg as entrepreneur_rating',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .orderBy('services.price', 'asc');

    return res.json({ success: true, services });
  } catch (error) {
    next(error);
  }
};

// Get single service
exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await db('services')
      .join('entrepreneurs', 'services.entrepreneur_id', 'entrepreneurs.id')
      .leftJoin('categories', 'services.category_id', 'categories.id')
      .where('services.id', id)
      .select(
        'services.*',
        'entrepreneurs.business_name as entrepreneur_name',
        'entrepreneurs.city as entrepreneur_city',
        'entrepreneurs.area as entrepreneur_area',
        'entrepreneurs.rating_avg as entrepreneur_rating',
        'categories.name as category_name'
      )
      .first();

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    return res.json({ success: true, service });
  } catch (error) {
    next(error);
  }
};

// Create service (Entrepreneur only)
exports.createService = async (req, res, next) => {
  try {
    const { title, description, price, duration_mins, category_id } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ success: false, message: 'Service title and price are required' });
    }

    const [id] = await db('services').insert({
      entrepreneur_id: req.entrepreneur.id,
      category_id: category_id || req.entrepreneur.category_id,
      title: title.trim(),
      description: description ? description.trim() : null,
      price: parseFloat(price),
      duration_mins: parseInt(duration_mins, 10) || 60,
      is_active: true
    });

    const created = await db('services').where({ id }).first();
    return res.status(201).json({ success: true, message: 'Service created successfully', service: created });
  } catch (error) {
    next(error);
  }
};

// Update service (Entrepreneur ownership check)
exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, duration_mins, is_active, category_id } = req.body;

    const service = await db('services').where({ id }).first();
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Ownership check
    if (service.entrepreneur_id !== req.entrepreneur.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this service' });
    }

    const updates = {};
    if (title) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (price !== undefined) updates.price = parseFloat(price);
    if (duration_mins !== undefined) updates.duration_mins = parseInt(duration_mins, 10);
    if (is_active !== undefined) updates.is_active = is_active;
    if (category_id) updates.category_id = category_id;
    updates.updated_at = db.fn.now();

    await db('services').where({ id }).update(updates);
    const updated = await db('services').where({ id }).first();

    return res.json({ success: true, message: 'Service updated successfully', service: updated });
  } catch (error) {
    next(error);
  }
};

// Delete service (Entrepreneur ownership check)
exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await db('services').where({ id }).first();
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Ownership check
    if (service.entrepreneur_id !== req.entrepreneur.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this service' });
    }

    await db('services').where({ id }).delete();
    return res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};
