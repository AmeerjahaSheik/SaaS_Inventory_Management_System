const express = require('express');
const router = express.Router();
const stockMovementController = require('../controllers/stockMovementController');
const {
  validateCreateMovement,
  validateMovementId,
  validateProductIdParam,
} = require('../validators/stockMovementValidator');
const validateRequest = require('../middleware/validateRequest');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

// POST /api/stock-movements
router.post('/', validateCreateMovement, validateRequest, stockMovementController.createMovement);

// GET /api/stock-movements
router.get('/', stockMovementController.getMovements);

// GET /api/stock-movements/:id
router.get('/:id', validateMovementId, validateRequest, stockMovementController.getMovementById);

// GET /api/stock-movements/product/:productId
router.get('/product/:productId', validateProductIdParam, validateRequest, stockMovementController.getProductMovements);

module.exports = router;

