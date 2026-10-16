const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Register a new customer or entrepreneur
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role, phone, business_name, category_id, skill_type, experience_years, bio, city, area } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existingUser = await db('users').where({ email: normalizedEmail }).first();
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const allowedRoles = ['customer', 'entrepreneur'];
    const assignedRole = allowedRoles.includes(role) ? role : 'customer';

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert user inside transaction
    let newUserId;
    let entrepreneurProfile = null;

    await db.transaction(async (trx) => {
      const [insertedId] = await trx('users').insert({
        full_name: full_name.trim(),
        email: normalizedEmail,
        password_hash,
        role: assignedRole,
        phone: phone ? phone.trim() : null
      });

      newUserId = insertedId;

      if (assignedRole === 'entrepreneur') {
        const [entId] = await trx('entrepreneurs').insert({
          user_id: newUserId,
          category_id: category_id || null,
          business_name: (business_name && business_name.trim()) || full_name.trim(),
          skill_type: (skill_type && skill_type.trim()) || 'Artisan / Craftsman',
          experience_years: Number(experience_years) || 1,
          bio: (bio && bio.trim()) || '',
          city: (city && city.trim()) || 'Jaipur',
          area: (area && area.trim()) || 'Local Market',
          status: 'pending' // Hidden until approved by admin
        });

        // Create initial welcome notification
        await trx('notifications').insert({
          user_id: newUserId,
          title: 'Welcome to HunarHub!',
          message: 'Your entrepreneur profile has been created and is currently pending verification by our admin team.',
          type: 'approval',
          link: '/entrepreneur/dashboard'
        });

        entrepreneurProfile = await trx('entrepreneurs').where({ id: entId }).first();
      } else {
        // Welcome notification for customer
        await trx('notifications').insert({
          user_id: newUserId,
          title: 'Welcome to HunarHub!',
          message: 'Discover skilled local micro-entrepreneurs and authentic handmade products.',
          type: 'system',
          link: '/browse'
        });
      }
    });

    const user = await db('users').where({ id: newUserId }).select('id', 'full_name', 'email', 'role', 'phone', 'created_at').first();

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: assignedRole === 'entrepreneur' 
        ? 'Registration successful! Your profile is pending admin approval.' 
        : 'Registration successful! Welcome to HunarHub.',
      token,
      user,
      entrepreneur: entrepreneurProfile
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db('users').where({ email: normalizedEmail }).first();

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let entrepreneur = null;
    if (user.role === 'entrepreneur') {
      entrepreneur = await db('entrepreneurs').where({ user_id: user.id }).first();
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      created_at: user.created_at
    };

    return res.json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      token,
      user: safeUser,
      entrepreneur
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).select('id', 'full_name', 'email', 'role', 'phone', 'avatar', 'created_at').first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let entrepreneur = null;
    if (user.role === 'entrepreneur') {
      entrepreneur = await db('entrepreneurs')
        .leftJoin('categories', 'entrepreneurs.category_id', 'categories.id')
        .select('entrepreneurs.*', 'categories.name as category_name')
        .where({ 'entrepreneurs.user_id': user.id })
        .first();
    }

    const unreadCountRow = await db('notifications')
      .where({ user_id: user.id, is_read: false })
      .count('* as count')
      .first();

    const unreadCount = Number(unreadCountRow.count) || 0;

    return res.json({
      success: true,
      user,
      entrepreneur,
      unreadNotifications: unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile (name, phone, email)
exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, email } = req.body;
    const userId = req.user.id;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const updates = {
      full_name: full_name.trim(),
      phone: phone ? phone.trim() : null
    };

    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db('users')
        .where({ email: normalizedEmail })
        .whereNot({ id: userId })
        .first();

      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      updates.email = normalizedEmail;
    }

    await db('users').where({ id: userId }).update(updates);

    const updatedUser = await db('users')
      .where({ id: userId })
      .select('id', 'full_name', 'email', 'role', 'phone', 'avatar', 'created_at')
      .first();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await db('users').where({ id: userId }).update({ password_hash });

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

