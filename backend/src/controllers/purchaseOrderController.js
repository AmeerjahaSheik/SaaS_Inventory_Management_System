const purchaseOrderService = require('../services/purchaseOrderService');

const getPurchaseOrders = async (req, res, next) => {
  try {
    const { supplier_id, status, page, limit } = req.query;
    const result = await purchaseOrderService.getPurchaseOrders({
      organizationId: req.user.organization_id,
      supplierId: supplier_id,
      status,
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

const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderService.getPurchaseOrderById({
      organizationId: req.user.organization_id,
      purchaseOrderId: id,
    });
    return res.status(200).json({
      success: true,
      data: po,
    });
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const po = await purchaseOrderService.createPurchaseOrder({
      organizationId: req.user.organization_id,
      userId: req.user.id,
      data: req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Purchase order created successfully.',
      data: po,
    });
  } catch (error) {
    next(error);
  }
};

const receivePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderService.receivePurchaseOrder({
      organizationId: req.user.organization_id,
      purchaseOrderId: id,
      userId: req.user.id,
    });
    return res.status(200).json({
      success: true,
      message: `Purchase order #${po.po_number} marked as received and inventory updated.`,
      data: po,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  receivePurchaseOrder,
};
