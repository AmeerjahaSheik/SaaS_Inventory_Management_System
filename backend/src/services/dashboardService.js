const { Op } = require('sequelize');
const { Product, Organization, StockLog, User } = require('../models');

async function getDashboardSummary(organizationId) {
  const org = await Organization.findByPk(organizationId);
  const defaultThreshold = org?.default_low_stock_threshold || 10;

  // 1. Total products
  const totalProducts = await Product.count({
    where: { organization_id: organizationId },
  });

  // 2. Out of stock products (quantity = 0)
  const outOfStockCount = await Product.count({
    where: {
      organization_id: organizationId,
      quantity: 0,
    },
  });

  // 3. Low stock products (quantity <= effective_threshold)
  const lowStockCount = await Product.count({
    where: {
      organization_id: organizationId,
      [Op.or]: [
        {
          [Op.and]: [
            { low_stock_threshold: { [Op.ne]: null } },
            Product.sequelize.literal('quantity <= low_stock_threshold'),
          ],
        },
        {
          [Op.and]: [
            { low_stock_threshold: null },
            { quantity: { [Op.lte]: defaultThreshold } },
          ],
        },
      ],
    },
  });

  // 4. Valuation & total stock
  const allProducts = await Product.findAll({
    where: { organization_id: organizationId },
    attributes: ['id', 'quantity', 'price', 'cost_price'],
    raw: true,
  });

  let totalInventoryValue = 0;
  let totalCostValue = 0;
  let totalStockQuantity = 0;

  for (const item of allProducts) {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = parseFloat(item.price) || 0;
    const cost = parseFloat(item.cost_price) || 0;

    totalInventoryValue += qty * price;
    totalCostValue += qty * cost;
    totalStockQuantity += qty;
  }

  // 5. Urgent Low-Stock Alerts (Top 6 products)
  const lowStockItems = await Product.findAll({
    where: {
      organization_id: organizationId,
      [Op.or]: [
        {
          [Op.and]: [
            { low_stock_threshold: { [Op.ne]: null } },
            Product.sequelize.literal('quantity <= low_stock_threshold'),
          ],
        },
        {
          [Op.and]: [
            { low_stock_threshold: null },
            { quantity: { [Op.lte]: defaultThreshold } },
          ],
        },
      ],
    },
    order: [['quantity', 'ASC']],
    limit: 6,
  });

  // 6. Recent Stock Logs (Last 6 activities)
  const recentStockLogs = await StockLog.findAll({
    where: { organization_id: organizationId },
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: 6,
  });

  return {
    metrics: {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
      totalCostValue: parseFloat(totalCostValue.toFixed(2)),
      totalStockQuantity,
      defaultThreshold,
    },
    lowStockItems: lowStockItems.map((p) => {
      const item = p.toJSON();
      const effectiveThreshold = item.low_stock_threshold !== null ? item.low_stock_threshold : defaultThreshold;
      return {
        ...item,
        effective_threshold: effectiveThreshold,
      };
    }),
    recentActivities: recentStockLogs,
  };
}

module.exports = {
  getDashboardSummary,
};

