const productService = require('../services/productService');

const getProducts = async (req, res, next) => {
  try {
    const { search, category, is_low_stock, page, limit } = req.query;
    const result = await productService.getProducts({
      organizationId: req.user.organization_id,
      search,
      category,
      isLowStock: is_low_stock,
      page,
      limit,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById({
      organizationId: req.user.organization_id,
      productId: id,
    });
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct({
      organizationId: req.user.organization_id,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await productService.updateProduct({
      organizationId: req.user.organization_id,
      productId: id,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct({
      organizationId: req.user.organization_id,
      productId: id,
    });
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await productService.getCategories(req.user.organization_id);
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};

