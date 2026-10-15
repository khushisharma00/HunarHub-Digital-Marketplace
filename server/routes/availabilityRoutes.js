const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticateToken, requireEntrepreneur } = require('../middleware/auth');

router.get('/', availabilityController.getSlots);
router.post('/', authenticateToken, requireEntrepreneur, availabilityController.addSlot);
router.delete('/:id', authenticateToken, requireEntrepreneur, availabilityController.deleteSlot);

module.exports = router;
