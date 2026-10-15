const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, serviceRequestController.createRequest);
router.get('/', authenticateToken, serviceRequestController.getRequests);
router.patch('/:id/status', authenticateToken, serviceRequestController.updateRequestStatus);
router.get('/:id/history', authenticateToken, serviceRequestController.getRequestHistory);

module.exports = router;
