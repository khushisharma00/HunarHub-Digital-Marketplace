const db = require('../config/db');

// Get all active categories with entrepreneur count
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await db('categories')
      .leftJoin('entrepreneurs', function () {
        this.on('categories.id', '=', 'entrepreneurs.category_id')
          .andOn('entrepreneurs.status', '=', db.raw('?', ['approved']));
      })
      .select(
        'categories.id',
        'categories.name',
        'categories.slug',
        'categories.description',
        'categories.icon',
        'categories.is_active'
      )
      .count('entrepreneurs.id as entrepreneur_count')
      .groupBy('categories.id')
      .orderBy('categories.name', 'asc');

    return res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// Admin create category
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await db('categories').where({ slug }).first();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category already exists' });
    }

    const [id] = await db('categories').insert({
      name: name.trim(),
      slug,
      description: description ? description.trim() : null,
      icon: icon || 'Wrench'
    });

    const category = await db('categories').where({ id }).first();
    return res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

// Admin update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, is_active } = req.body;

    const existing = await db('categories').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updates = {};
    if (name) {
      updates.name = name.trim();
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (is_active !== undefined) updates.is_active = is_active;

    await db('categories').where({ id }).update(updates);
    const updated = await db('categories').where({ id }).first();

    return res.json({ success: true, message: 'Category updated successfully', category: updated });
  } catch (error) {
    next(error);
  }
};

// Admin delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await db('categories').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await db('categories').where({ id }).delete();
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
