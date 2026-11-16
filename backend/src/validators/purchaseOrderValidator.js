const { body, param, query } = require('express-validator');

const validateCreatePurchaseOrder = [
  body('supplier_id')
    .notEmpty()
    .withMessage('Supplier ID is required.')
    .isUUID(4)
    .withMessage('Invalid supplier ID format.'),
  body('po_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('PO number cannot exceed 50 characters.'),
  body('order_date')
    .optional()
    .isISO8601()
    .withMessage('Order date must be a valid ISO 8601 date.'),
  body('expected_delivery_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Expected delivery date must be a valid ISO 8601 date.'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one line item is required.'),
  body('items.*.product_id')
    .notEmpty()
    .withMessage('Product ID is required for each line item.')
    .isUUID(4)
    .withMessage('Invalid product ID format.'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer greater than 0.'),
  body('items.*.unit_cost')
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a non-negative number.'),
];

const validatePurchaseOrderId = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid purchase order ID format.'),
];

module.exports = {
  validateCreatePurchaseOrder,
  validatePurchaseOrderId,
};
