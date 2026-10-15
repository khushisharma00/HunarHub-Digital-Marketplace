const db = require('../config/db');

// List products with search, filter, and pagination
exports.getProducts = async (req, res, next) => {
  try {
    const {
      q,
      category,
      city,
      min_price,
      max_price,
      entrepreneur_id,
      in_stock,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    let query = db('products')
      .join('entrepreneurs', 'products.entrepreneur_id', 'entrepreneurs.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('products.is_active', true)
      .andWhere('entrepreneurs.status', 'approved');

    if (entrepreneur_id) {
      query = query.andWhere('products.entrepreneur_id', entrepreneur_id);
    }

    if (category) {
      if (!isNaN(category)) {
        query = query.andWhere('products.category_id', parseInt(category, 10));
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
        this.where('products.name', 'like', term)
          .orWhere('products.description', 'like', term)
          .orWhere('entrepreneurs.business_name', 'like', term);
      });
    }

    if (min_price) {
      query = query.andWhere('products.price', '>=', parseFloat(min_price));
    }
    if (max_price) {
      query = query.andWhere('products.price', '<=', parseFloat(max_price));
    }

    if (in_stock === 'true') {
      query = query.andWhere('products.stock', '>', 0);
    }

    // Count total
    const countQuery = query.clone().clearSelect().clearOrder().count('products.id as total').first();
    const totalRow = await countQuery;
    const total = totalRow ? Number(totalRow.total) : 0;

    // Sorting
    if (sort === 'price_asc') {
      query = query.orderBy('products.price', 'asc');
    } else if (sort === 'price_desc') {
      query = query.orderBy('products.price', 'desc');
    } else {
      query = query.orderBy('products.created_at', 'desc');
    }

    const products = await query
      .select(
        'products.*',
        'entrepreneurs.business_name as entrepreneur_name',
        'entrepreneurs.city as entrepreneur_city',
        'entrepreneurs.area as entrepreneur_area',
        'entrepreneurs.rating_avg as entrepreneur_rating',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .limit(limitNum)
      .offset(offset);

    return res.json({
      success: true,
      products,
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

// Get single product
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await db('products')
      .join('entrepreneurs', 'products.entrepreneur_id', 'entrepreneurs.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .where('products.id', id)
      .select(
        'products.*',
        'entrepreneurs.business_name as entrepreneur_name',
        'entrepreneurs.city as entrepreneur_city',
        'entrepreneurs.area as entrepreneur_area',
        'entrepreneurs.rating_avg as entrepreneur_rating',
        'entrepreneurs.profile_photo as entrepreneur_photo',
        'categories.name as category_name',
        'categories.slug as category_slug'
      )
      .first();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// Create product (Entrepreneur only)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: 'Product name, price, and initial stock are required' });
    }

    if (parseFloat(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    }

    if (parseInt(stock, 10) < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const [id] = await db('products').insert({
      entrepreneur_id: req.entrepreneur.id,
      category_id: category_id || req.entrepreneur.category_id,
      name: name.trim(),
      description: description ? description.trim() : null,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      image_url: finalImageUrl || '/images/pottery.jpg',
      is_active: true
    });

    const created = await db('products').where({ id }).first();
    return res.status(201).json({ success: true, message: 'Product created successfully', product: created });
  } catch (error) {
    next(error);
  }
};

// Update product (Entrepreneur ownership check)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, is_active, category_id, image_url } = req.body;

    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.entrepreneur_id !== req.entrepreneur.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this product' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (price !== undefined) {
      if (parseFloat(price) < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
      updates.price = parseFloat(price);
    }
    if (stock !== undefined) {
      if (parseInt(stock, 10) < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
      updates.stock = parseInt(stock, 10);
    }
    if (is_active !== undefined) updates.is_active = is_active;
    if (category_id) updates.category_id = category_id;
    if (req.file) {
      updates.image_url = `/uploads/${req.file.filename}`;
    } else if (image_url) {
      updates.image_url = image_url;
    }
    updates.updated_at = db.fn.now();

    await db('products').where({ id }).update(updates);
    const updated = await db('products').where({ id }).first();

    return res.json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error) {
    next(error);
  }
};

// Delete product (Entrepreneur ownership check)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await db('products').where({ id }).first();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.entrepreneur_id !== req.entrepreneur.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this product' });
    }

    await db('products').where({ id }).delete();
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
