const supplierService = require('../services/supplierService');

const getSuppliers = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await supplierService.getSuppliers({
      organizationId: req.user.organization_id,
      search,
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

const getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.getSupplierById({
      organizationId: req.user.organization_id,
      supplierId: id,
    });
    return res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.createSupplier({
      organizationId: req.user.organization_id,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Supplier created successfully.',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await supplierService.updateSupplier({
      organizationId: req.user.organization_id,
      supplierId: id,
      data: req.body,
    });
    return res.status(200).json({
      success: true,
      message: 'Supplier updated successfully.',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await supplierService.deleteSupplier({
      organizationId: req.user.organization_id,
      supplierId: id,
    });
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
