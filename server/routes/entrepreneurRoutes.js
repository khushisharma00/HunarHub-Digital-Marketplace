const express = require('express');
const router = express.Router();
const entrepreneurController = require('../controllers/entrepreneurController');
const { authenticateToken, requireEntrepreneur } = require('../middleware/auth');

router.get('/', entrepreneurController.getEntrepreneurs);
router.get('/:id', entrepreneurController.getEntrepreneurById);
router.put('/me/profile', authenticateToken, requireEntrepreneur, entrepreneurController.updateProfile);

module.exports = router;
