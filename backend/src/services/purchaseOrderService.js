const { sequelize, PurchaseOrder, PurchaseOrderItem, Supplier, Product, StockMovement, StockLog, User } = require('../models');

/**
 * Fetch all purchase orders for an organization.
 */
async function getPurchaseOrders({ organizationId, supplierId, status, page = 1, limit = 20 }) {
  const where = {
    organization_id: organizationId,
  };

  if (supplierId) {
    where.supplier_id = supplierId;
  }

  if (status) {
    where.status = status;
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await PurchaseOrder.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset,
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'supplier_name', 'email', 'phone', 'company_name'],
      },
      {
        model: PurchaseOrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'quantity'],
          },
        ],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  return {
    purchaseOrders: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit) || 1,
    },
  };
}

/**
 * Fetch a single purchase order by ID with tenant isolation.
 */
async function getPurchaseOrderById({ organizationId, purchaseOrderId }) {
  const po = await PurchaseOrder.findOne({
    where: {
      id: purchaseOrderId,
      organization_id: organizationId,
    },
    include: [
      {
        model: Supplier,
        as: 'supplier',
      },
      {
        model: PurchaseOrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'sku', 'quantity'],
          },
        ],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  if (!po) {
    const error = new Error('Purchase order not found.');
    error.status = 404;
    throw error;
  }

  return po;
}

/**
 * Create a new purchase order with line items.
 */
async function createPurchaseOrder({ organizationId, userId, data }) {
  const { supplier_id, po_number, order_date, expected_delivery_date, notes, items } = data;

  // 1. Verify supplier belongs to this organization
  const supplier = await Supplier.findOne({
    where: {
      id: supplier_id,
      organization_id: organizationId,
    },
  });

  if (!supplier) {
    const error = new Error('Selected supplier does not exist in your organization.');
    error.status = 404;
    throw error;
  }

  // 2. Verify all product IDs belong to this organization
  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({
    where: {
      id: productIds,
      organization_id: organizationId,
    },
  });

  if (products.length !== productIds.length) {
    const error = new Error('One or more selected products do not belong to your organization.');
    error.status = 400;
    throw error;
  }

  // 3. Generate PO Number if not provided
  let generatedPoNumber = po_number ? po_number.trim() : null;
  if (!generatedPoNumber) {
    const today = new Date();
    const datePrefix = `PO-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const count = await PurchaseOrder.count({ where: { organization_id: organizationId } });
    generatedPoNumber = `${datePrefix}-${String(count + 1).padStart(4, '0')}`;
  }

  // 4. Calculate item totals and overall total
  let totalAmount = 0;
  const itemsToCreate = items.map((item) => {
    const qty = parseInt(item.quantity, 10);
    const unitCost = parseFloat(item.unit_cost);
    const totalCost = Number((qty * unitCost).toFixed(2));
    totalAmount += totalCost;
    return {
      product_id: item.product_id,
      quantity: qty,
      unit_cost: unitCost,
      total_cost: totalCost,
    };
  });

  // 5. Execute transaction
  const createdPo = await sequelize.transaction(async (t) => {
    const po = await PurchaseOrder.create(
      {
        organization_id: organizationId,
        supplier_id,
        po_number: generatedPoNumber,
        status: 'ORDERED',
        order_date: order_date || new Date(),
        expected_delivery_date: expected_delivery_date || null,
        total_amount: Number(totalAmount.toFixed(2)),
        notes: notes ? notes.trim() : null,
        created_by: userId,
      },
      { transaction: t }
    );

    const itemsWithPoId = itemsToCreate.map((item) => ({
      ...item,
      purchase_order_id: po.id,
    }));

    await PurchaseOrderItem.bulkCreate(itemsWithPoId, { transaction: t });

    return po;
  });

  return await getPurchaseOrderById({ organizationId, purchaseOrderId: createdPo.id });
}

/**
 * Mark a purchase order as received and auto-update stock inventory.
 */
async function receivePurchaseOrder({ organizationId, purchaseOrderId, userId }) {
  return await sequelize.transaction(async (t) => {
    const po = await PurchaseOrder.findOne({
      where: {
        id: purchaseOrderId,
        organization_id: organizationId,
      },
      include: [
        { model: Supplier, as: 'supplier' },
        { model: PurchaseOrderItem, as: 'items' },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!po) {
      const error = new Error('Purchase order not found.');
      error.status = 404;
      throw error;
    }

    if (po.status === 'RECEIVED') {
      const error = new Error('Purchase order has already been received.');
      error.status = 400;
      throw error;
    }

    if (po.status === 'CANCELLED') {
      const error = new Error('Cannot receive a cancelled purchase order.');
      error.status = 400;
      throw error;
    }

    // Process each item to update product inventory and insert stock movements
    for (const item of po.items) {
      const product = await Product.findOne({
        where: { id: item.product_id, organization_id: organizationId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (product) {
        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity + item.quantity;

        product.quantity = newQuantity;
        await product.save({ transaction: t });

        // Insert Stock Movement
        await StockMovement.create(
          {
            organization_id: organizationId,
            product_id: product.id,
            movement_type: 'IN',
            quantity: item.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: `PO Received: #${po.po_number} from ${po.supplier ? po.supplier.supplier_name : 'Supplier'}`,
            reference_number: po.po_number,
            created_by: userId,
          },
          { transaction: t }
        );

        // Also record legacy StockLog for audit compatibility
        await StockLog.create(
          {
            organization_id: organizationId,
            product_id: product.id,
            user_id: userId,
            type: 'in',
            quantity_change: item.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: `PO Received: #${po.po_number}`,
          },
          { transaction: t }
        );
      }
    }

    po.status = 'RECEIVED';
    await po.save({ transaction: t });

    return po;
  });
}

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  receivePurchaseOrder,
};
