const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authenticate = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  validateCreateSupplier,
  validateUpdateSupplier,
  validateSupplierId,
  validateGetSuppliers,
} = require('../validators/supplierValidator');

// All supplier routes are protected by JWT authentication
router.use(authenticate);

// GET /api/suppliers
router.get('/', validateGetSuppliers, validateRequest, supplierController.getSuppliers);

// POST /api/suppliers
router.post('/', validateCreateSupplier, validateRequest, supplierController.createSupplier);

// GET /api/suppliers/:id
router.get('/:id', validateSupplierId, validateRequest, supplierController.getSupplierById);

// PUT /api/suppliers/:id
router.put('/:id', validateUpdateSupplier, validateRequest, supplierController.updateSupplier);

// DELETE /api/suppliers/:id
router.delete('/:id', validateSupplierId, validateRequest, supplierController.deleteSupplier);

module.exports = router;
