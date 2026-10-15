const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireEntrepreneur } = require('../middleware/auth');

router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', authenticateToken, requireEntrepreneur, serviceController.createService);
router.put('/:id', authenticateToken, requireEntrepreneur, serviceController.updateService);
router.delete('/:id', authenticateToken, requireEntrepreneur, serviceController.deleteService);

module.exports = router;
