const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const {
  validateCreateProduct,
  validateUpdateProduct,
} = require('../validators/productValidator');
const validateRequest = require('../middleware/validateRequest');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);
router.post('/', validateCreateProduct, validateRequest, productController.createProduct);
router.put('/:id', validateUpdateProduct, validateRequest, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;

