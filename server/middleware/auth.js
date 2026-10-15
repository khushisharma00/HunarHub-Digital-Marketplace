const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hunarhub-super-secret-jwt-key-change-in-prod';

// Verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Require one of specific roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
}

// Entrepreneur middleware: loads entrepreneur profile for current user
async function requireEntrepreneur(req, res, next) {
  if (!req.user || req.user.role !== 'entrepreneur') {
    return res.status(403).json({ success: false, message: 'Access denied. Entrepreneur account required.' });
  }

  try {
    const entrepreneur = await db('entrepreneurs').where({ user_id: req.user.id }).first();
    if (!entrepreneur) {
      return res.status(404).json({ success: false, message: 'Entrepreneur profile not found. Please complete profile setup.' });
    }
    req.entrepreneur = entrepreneur;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  requireEntrepreneur
};
