const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, orderController.createOrder);
router.get('/', authenticateToken, orderController.getOrders);
router.patch('/:id/status', authenticateToken, orderController.updateOrderStatus);

module.exports = router;
