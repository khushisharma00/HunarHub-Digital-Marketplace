const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireEntrepreneur } = require('../middleware/auth');

router.get('/entrepreneur', authenticateToken, requireEntrepreneur, dashboardController.getEntrepreneurDashboard);
router.get('/customer', authenticateToken, dashboardController.getCustomerDashboard);

module.exports = router;
