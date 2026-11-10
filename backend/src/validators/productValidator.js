const { body, param, query } = require('express-validator');

const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Product name must be between 2 and 150 characters.'),
  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required.')
    .isLength({ min: 1, max: 50 })
    .withMessage('SKU must be between 1 and 50 characters.')
    .toUpperCase(),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('category')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters.'),
  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number greater than or equal to 0.'),
  body('cost_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a valid number greater than or equal to 0.'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Initial quantity must be a non-negative integer.'),
  body('low_stock_threshold')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer.'),
];

const validateUpdateProduct = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid product ID format.'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Product name must be between 2 and 150 characters.'),
  body('sku')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU cannot be empty.')
    .isLength({ min: 1, max: 50 })
    .withMessage('SKU must be between 1 and 50 characters.')
    .toUpperCase(),
  body('description')
    .optional({ nullable: true }),
  body('category')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters.'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a valid number greater than or equal to 0.'),
  body('cost_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a valid number greater than or equal to 0.'),
  body('low_stock_threshold')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || Number.isInteger(Number(value)) && Number(value) >= 0) {
        return true;
      }
      throw new Error('Low stock threshold must be a non-negative integer or null.');
    }),
];

const validateStockAdjustment = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid product ID format.'),
  body('type')
    .notEmpty()
    .withMessage('Adjustment type is required.')
    .isIn(['in', 'out', 'adjustment'])
    .withMessage("Adjustment type must be 'in', 'out', or 'adjustment'."),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt({ min: 0 })
    .withMessage('Quantity must be an integer greater than or equal to 0.'),
  body('reason')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Reason cannot exceed 255 characters.'),
];

const validateSettings = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organization name cannot be empty.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Organization name must be between 2 and 100 characters.'),
  body('default_low_stock_threshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Default low stock threshold must be a non-negative integer.'),
];

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateStockAdjustment,
  validateSettings,
};

