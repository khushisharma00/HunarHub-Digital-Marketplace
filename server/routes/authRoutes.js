const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rate limiting for login: max 15 requests per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
