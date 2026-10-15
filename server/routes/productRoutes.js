const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireEntrepreneur } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authenticateToken, requireEntrepreneur, upload.single('image'), productController.createProduct);
router.put('/:id', authenticateToken, requireEntrepreneur, upload.single('image'), productController.updateProduct);
router.delete('/:id', authenticateToken, requireEntrepreneur, productController.deleteProduct);

module.exports = router;
