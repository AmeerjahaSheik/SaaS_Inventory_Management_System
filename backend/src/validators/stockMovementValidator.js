const { body, param, query } = require('express-validator');

const validateCreateMovement = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required.')
    .isUUID(4)
    .withMessage('Invalid Product ID format.'),
  body('movementType')
    .notEmpty()
    .withMessage('Movement type is required.')
    .custom((val) => {
      const upper = (val || '').toUpperCase();
      if (!['IN', 'OUT', 'ADJUSTMENT'].includes(upper)) {
        throw new Error("Movement type must be 'IN', 'OUT', or 'ADJUSTMENT'.");
      }
      return true;
    }),
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
  body('referenceNumber')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number cannot exceed 100 characters.'),
];

const validateMovementId = [
  param('id')
    .isUUID(4)
    .withMessage('Invalid Movement ID format.'),
];

const validateProductIdParam = [
  param('productId')
    .isUUID(4)
    .withMessage('Invalid Product ID format.'),
];

module.exports = {
  validateCreateMovement,
  validateMovementId,
  validateProductIdParam,
};

