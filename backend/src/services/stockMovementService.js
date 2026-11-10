const { Op } = require('sequelize');
const { sequelize, StockMovement, Product, User, StockLog } = require('../models');

/**
 * Record a new stock movement with full ACID transaction safety.
 */
async function recordStockMovement({
  organizationId,
  userId,
  productId,
  movementType,
  quantity,
  reason = null,
  referenceNumber = null,
}) {
  const normalizedType = (movementType || '').toUpperCase().trim();
  if (!['IN', 'OUT', 'ADJUSTMENT'].includes(normalizedType)) {
    const error = new Error("Movement type must be 'IN', 'OUT', or 'ADJUSTMENT'.");
    error.statusCode = 400;
    throw error;
  }

  const parsedQty = parseInt(quantity, 10);
  if (isNaN(parsedQty) || parsedQty < 0) {
    const error = new Error('Quantity must be a valid non-negative integer.');
    error.statusCode = 400;
    throw error;
  }

  return await sequelize.transaction(async (t) => {
    // 1. Fetch current product with lock
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
    let recordedQuantityMagnitude = parsedQty;

    if (normalizedType === 'IN') {
      if (parsedQty <= 0) {
        const error = new Error("Quantity for 'IN' movement must be greater than 0.");
        error.statusCode = 400;
        throw error;
      }
      newQuantity = previousQuantity + parsedQty;
    } else if (normalizedType === 'OUT') {
      if (parsedQty <= 0) {
        const error = new Error("Quantity for 'OUT' movement must be greater than 0.");
        error.statusCode = 400;
        throw error;
      }
      if (previousQuantity < parsedQty) {
        const error = new Error(
          `Cannot remove ${parsedQty} units. Only ${previousQuantity} units available in stock.`
        );
        error.statusCode = 400;
        throw error;
      }
      newQuantity = previousQuantity - parsedQty;
    } else if (normalizedType === 'ADJUSTMENT') {
      // In ADJUSTMENT, parsedQty represents the exact new target stock level
      newQuantity = parsedQty;
      recordedQuantityMagnitude = Math.abs(newQuantity - previousQuantity);
    }

    // Double check negative stock invariant
    if (newQuantity < 0) {
      const error = new Error('Stock quantity cannot become negative.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Update product quantity
    product.quantity = newQuantity;
    await product.save({ transaction: t });

    // 3. Insert stock_movements record
    const movement = await StockMovement.create(
      {
        organization_id: organizationId,
        product_id: productId,
        movement_type: normalizedType,
        quantity: recordedQuantityMagnitude,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: reason ? reason.trim() : null,
        reference_number: referenceNumber ? referenceNumber.trim() : null,
        created_by: userId,
      },
      { transaction: t }
    );

    // 4. Synchronize with legacy StockLog for audit trail continuity
    const legacyType = normalizedType === 'IN' ? 'in' : normalizedType === 'OUT' ? 'out' : 'adjustment';
    const legacyChange = normalizedType === 'IN' ? parsedQty : normalizedType === 'OUT' ? -parsedQty : (newQuantity - previousQuantity);
    await StockLog.create(
      {
        organization_id: organizationId,
        product_id: productId,
        user_id: userId,
        type: legacyType,
        quantity_change: legacyChange,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: reason ? reason.trim() : null,
      },
      { transaction: t }
    );

    // Fetch full movement with product and user details
    const populatedMovement = await StockMovement.findByPk(movement.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'category', 'price'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      transaction: t,
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
      },
      movement: populatedMovement,
    };
  });
}

/**
 * Fetch filtered, paginated stock movements for an organization.
 */
async function getStockMovements({
  organizationId,
  productId = '',
  movementType = '',
  startDate = '',
  endDate = '',
  search = '',
  page = 1,
  limit = 20,
}) {
  const where = {
    organization_id: organizationId,
  };

  if (productId && productId.trim() !== '') {
    where.product_id = productId.trim();
  }

  if (movementType && movementType.trim() !== '' && movementType !== 'ALL') {
    where.movement_type = movementType.trim().toUpperCase();
  }

  // Date range filter
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      // Include the entire end day up to 23:59:59.999
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.created_at[Op.lte] = end;
    }
  }

  const productWhere = {};
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { reason: { [Op.like]: term } },
      { reference_number: { [Op.like]: term } },
      { '$product.name$': { [Op.like]: term } },
      { '$product.sku$': { [Op.like]: term } },
    ];
  }

  const parsedLimit = parseInt(limit, 10) || 20;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await StockMovement.findAndCountAll({
    where,
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'category', 'price'],
        where: productWhere,
        required: true,
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
        required: false,
      },
    ],
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset,
    distinct: true,
  });

  return {
    movements: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit) || 1,
    },
  };
}

/**
 * Fetch a single stock movement by ID (organization-scoped).
 */
async function getStockMovementById({ organizationId, id }) {
  const movement = await StockMovement.findOne({
    where: {
      id,
      organization_id: organizationId,
    },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'category', 'price'],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!movement) {
    const error = new Error('Stock movement record not found in this organization.');
    error.statusCode = 404;
    throw error;
  }

  return movement;
}

/**
 * Fetch all stock movements for a specific product (organization-scoped).
 */
async function getProductStockMovements({ organizationId, productId, page = 1, limit = 50 }) {
  // Ensure product belongs to the organization
  const product = await Product.findOne({
    where: {
      id: productId,
      organization_id: organizationId,
    },
  });

  if (!product) {
    const error = new Error('Product not found in this organization.');
    error.statusCode = 404;
    throw error;
  }

  const parsedLimit = parseInt(limit, 10) || 50;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await StockMovement.findAndCountAll({
    where: {
      organization_id: organizationId,
      product_id: productId,
    },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku', 'category', 'price'],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      current_quantity: product.quantity,
    },
    movements: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit) || 1,
    },
  };
}

module.exports = {
  recordStockMovement,
  getStockMovements,
  getStockMovementById,
  getProductStockMovements,
};

