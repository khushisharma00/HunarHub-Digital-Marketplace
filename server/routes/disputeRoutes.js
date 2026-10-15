const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, disputeController.raiseDispute);
router.get('/', authenticateToken, disputeController.getDisputes);
router.patch('/:id/resolve', authenticateToken, requireRole('admin'), disputeController.resolveDispute);

module.exports = router;
