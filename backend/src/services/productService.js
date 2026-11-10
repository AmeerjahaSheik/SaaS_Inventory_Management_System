const { Op } = require('sequelize');
const { Product, Organization } = require('../models');

/**
 * Fetch products for an organization with optional search, category filter, low-stock filter, and pagination
 */
async function getProducts({
  organizationId,
  search = '',
  category = '',
  isLowStock = false,
  page = 1,
  limit = 20,
}) {
  const org = await Organization.findByPk(organizationId);
  const defaultThreshold = org?.default_low_stock_threshold || 10;

  const where = {
    organization_id: organizationId,
  };

  // Search filter by product name or SKU
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: term } },
      { sku: { [Op.like]: term } },
    ];
  }

  // Category filter
  if (category && category.trim() !== '') {
    where.category = category.trim();
  }

  // Low-stock filter: quantity <= COALESCE(low_stock_threshold, defaultThreshold)
  if (isLowStock === true || isLowStock === 'true') {
    where[Op.and] = [
      ...(where[Op.and] || []),
      {
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
    ];
  }

  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const parsedLimit = parseInt(limit, 10);

  const { count, rows } = await Product.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  // Augment rows with computed isLowStock boolean
  const productsWithStatus = rows.map((p) => {
    const item = p.toJSON();
    const effectiveThreshold = item.low_stock_threshold !== null ? item.low_stock_threshold : defaultThreshold;
    return {
      ...item,
      effective_threshold: effectiveThreshold,
      is_low_stock: item.quantity <= effectiveThreshold,
    };
  });

  return {
    products: productsWithStatus,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit) || 1,
    },
    defaultThreshold,
  };
}

/**
 * Fetch a single product by ID (scoped to organization)
 */
async function getProductById({ organizationId, productId }) {
  const org = await Organization.findByPk(organizationId);
  const defaultThreshold = org?.default_low_stock_threshold || 10;

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

  const item = product.toJSON();
  const effectiveThreshold = item.low_stock_threshold !== null ? item.low_stock_threshold : defaultThreshold;

  return {
    ...item,
    effective_threshold: effectiveThreshold,
    is_low_stock: item.quantity <= effectiveThreshold,
  };
}

/**
 * Create a new product within an organization
 */
async function createProduct({ organizationId, data }) {
  const normalizedSku = data.sku.trim().toUpperCase();

  // Validate SKU uniqueness within the organization
  const existingSku = await Product.findOne({
    where: {
      organization_id: organizationId,
      sku: normalizedSku,
    },
  });

  if (existingSku) {
    const error = new Error(`A product with SKU '${normalizedSku}' already exists in your organization.`);
    error.statusCode = 409;
    throw error;
  }

  const product = await Product.create({
    organization_id: organizationId,
    name: data.name.trim(),
    sku: normalizedSku,
    description: data.description ? data.description.trim() : null,
    category: data.category ? data.category.trim() : null,
    price: data.price,
    cost_price: data.cost_price || 0.0,
    quantity: data.quantity !== undefined ? parseInt(data.quantity, 10) : 0,
    low_stock_threshold: data.low_stock_threshold !== undefined && data.low_stock_threshold !== '' && data.low_stock_threshold !== null
      ? parseInt(data.low_stock_threshold, 10)
      : null,
  });

  return product;
}

/**
 * Update an existing product (scoped to organization)
 */
async function updateProduct({ organizationId, productId, data }) {
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

  // If SKU is being updated, verify uniqueness
  if (data.sku) {
    const normalizedSku = data.sku.trim().toUpperCase();
    if (normalizedSku !== product.sku) {
      const existingSku = await Product.findOne({
        where: {
          organization_id: organizationId,
          sku: normalizedSku,
          id: { [Op.ne]: productId },
        },
      });

      if (existingSku) {
        const error = new Error(`A product with SKU '${normalizedSku}' already exists in your organization.`);
        error.statusCode = 409;
        throw error;
      }
      product.sku = normalizedSku;
    }
  }

  if (data.name !== undefined) product.name = data.name.trim();
  if (data.description !== undefined) product.description = data.description ? data.description.trim() : null;
  if (data.category !== undefined) product.category = data.category ? data.category.trim() : null;
  if (data.price !== undefined) product.price = data.price;
  if (data.cost_price !== undefined) product.cost_price = data.cost_price;
  if (data.low_stock_threshold !== undefined) {
    product.low_stock_threshold = data.low_stock_threshold === null || data.low_stock_threshold === ''
      ? null
      : parseInt(data.low_stock_threshold, 10);
  }

  await product.save();
  return product;
}

/**
 * Delete a product (scoped to organization)
 */
async function deleteProduct({ organizationId, productId }) {
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

  await product.destroy();
  return { message: 'Product deleted successfully.' };
}

/**
 * Get distinct categories for the organization
 */
async function getCategories(organizationId) {
  const categories = await Product.findAll({
    attributes: [[Product.sequelize.fn('DISTINCT', Product.sequelize.col('category')), 'category']],
    where: {
      organization_id: organizationId,
      category: { [Op.ne]: null },
    },
    raw: true,
  });

  return categories.map((c) => c.category).filter(Boolean);
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};

