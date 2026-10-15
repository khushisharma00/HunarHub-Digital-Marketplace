const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const serviceRequestController = require('../controllers/serviceRequestController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes here require admin role
router.use(authenticateToken, requireRole('admin'));

router.get('/analytics', adminController.getAnalytics);
router.get('/entrepreneurs', adminController.getEntrepreneursList);
router.patch('/entrepreneurs/:id/status', adminController.updateEntrepreneurStatus);
router.get('/orders', orderController.getOrders);
router.get('/service-requests', serviceRequestController.getRequests);

module.exports = router;
