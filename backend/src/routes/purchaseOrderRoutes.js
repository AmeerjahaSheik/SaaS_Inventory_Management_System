const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const authenticate = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  validateCreatePurchaseOrder,
  validatePurchaseOrderId,
} = require('../validators/purchaseOrderValidator');

router.use(authenticate);

// GET /api/purchase-orders
router.get('/', purchaseOrderController.getPurchaseOrders);

// POST /api/purchase-orders
router.post('/', validateCreatePurchaseOrder, validateRequest, purchaseOrderController.createPurchaseOrder);

// GET /api/purchase-orders/:id
router.get('/:id', validatePurchaseOrderId, validateRequest, purchaseOrderController.getPurchaseOrderById);

// PUT /api/purchase-orders/:id/receive
router.put('/:id/receive', validatePurchaseOrderId, validateRequest, purchaseOrderController.receivePurchaseOrder);

module.exports = router;
