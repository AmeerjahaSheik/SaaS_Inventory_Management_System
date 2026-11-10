const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { validateStockAdjustment } = require('../validators/productValidator');
const validateRequest = require('../middleware/validateRequest');
const authenticate = require('../middleware/authMiddleware');

router.use(authenticate);

// Adjust product stock
router.post('/products/:id/adjust', validateStockAdjustment, validateRequest, stockController.adjustStock);

// Get product stock audit logs
router.get('/products/:id/logs', stockController.getStockLogs);

module.exports = router;

