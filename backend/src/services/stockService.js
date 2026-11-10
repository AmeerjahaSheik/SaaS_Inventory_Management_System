const { sequelize, Product, StockLog, User } = require('../models');

/**
 * Adjust stock quantity for a product with full transaction safety and audit logging
 */
async function adjustStock({
  organizationId,
  userId,
  productId,
  type,
  quantity,
  reason = null,
}) {
  const parsedQuantity = parseInt(quantity, 10);

  return await sequelize.transaction(async (t) => {
    // 1. Lock the product row for update to prevent race conditions
    const product = await Product.findOne({
      where: {
        id: productId,
        organization_id: organizationId,
      },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!product) {
      const error = new Error('Product not found in this organization.');
      error.statusCode = 404;
      throw error;
    }

    const previousQuantity = product.quantity;
    let newQuantity = previousQuantity;
    let quantityChange = 0;

    if (type === 'in') {
      if (parsedQuantity <= 0) {
        const error = new Error("Quantity for 'in' adjustment must be greater than 0.");
        error.statusCode = 400;
        throw error;
      }
      quantityChange = parsedQuantity;
      newQuantity = previousQuantity + parsedQuantity;
    } else if (type === 'out') {
      if (parsedQuantity <= 0) {
        const error = new Error("Quantity for 'out' adjustment must be greater than 0.");
        error.statusCode = 400;
        throw error;
      }
      if (previousQuantity < parsedQuantity) {
        const error = new Error(
          `Cannot remove ${parsedQuantity} units. Only ${previousQuantity} units in stock.`
        );
        error.statusCode = 400;
        throw error;
      }
      quantityChange = -parsedQuantity;
      newQuantity = previousQuantity - parsedQuantity;
    } else if (type === 'adjustment') {
      if (parsedQuantity < 0) {
        const error = new Error('Adjusted stock quantity cannot be negative.');
        error.statusCode = 400;
        throw error;
      }
      quantityChange = parsedQuantity - previousQuantity;
      newQuantity = parsedQuantity;
    }

    // 2. Update product stock quantity
    product.quantity = newQuantity;
    await product.save({ transaction: t });

    // 3. Create immutable stock audit log
    const stockLog = await StockLog.create(
      {
        organization_id: organizationId,
        product_id: productId,
        user_id: userId,
        type,
        quantity_change: quantityChange,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: reason ? reason.trim() : null,
      },
      { transaction: t }
    );

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
      },
      stockLog,
    };
  });
}

/**
 * Fetch stock logs for a specific product
 */
async function getProductStockLogs({ organizationId, productId, limit = 50 }) {
  // First ensure product belongs to the organization
  const product = await Product.findOne({
    where: { id: productId, organization_id: organizationId },
  });

  if (!product) {
    const error = new Error('Product not found in this organization.');
    error.statusCode = 404;
    throw error;
  }

  const logs = await StockLog.findAll({
    where: {
      organization_id: organizationId,
      product_id: productId,
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
  });

  return logs;
}

module.exports = {
  adjustStock,
  getProductStockLogs,
};

