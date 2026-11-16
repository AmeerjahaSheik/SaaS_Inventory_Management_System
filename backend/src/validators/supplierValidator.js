const { body, param, query } = require('express-validator');

const validateCreateSupplier = [
  body('supplier_name')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Supplier name must be between 2 and 150 characters.'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number cannot exceed 50 characters.'),
  body('company_name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Company name cannot exceed 150 characters.'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
];

const validateUpdateSupplier = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid supplier ID format.'),
  body('supplier_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Supplier name cannot be empty.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Supplier name must be between 2 and 150 characters.'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number cannot exceed 50 characters.'),
  body('company_name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Company name cannot exceed 150 characters.'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),
];

const validateSupplierId = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid supplier ID format.'),
];

const validateGetSuppliers = [
  query('search')
    .optional()
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
];

module.exports = {
  validateCreateSupplier,
  validateUpdateSupplier,
  validateSupplierId,
  validateGetSuppliers,
};
