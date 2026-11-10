const stockService = require('../services/stockService');

const adjustStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason } = req.body;

    const result = await stockService.adjustStock({
      organizationId: req.user.organization_id,
      userId: req.user.id,
      productId: id,
      type,
      quantity,
      reason,
    });

    return res.status(200).json({
      success: true,
      message: `Stock successfully adjusted (${type}).`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getStockLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const logs = await stockService.getProductStockLogs({
      organizationId: req.user.organization_id,
      productId: id,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adjustStock,
  getStockLogs,
};

