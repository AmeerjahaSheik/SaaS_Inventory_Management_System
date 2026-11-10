const stockMovementService = require('../services/stockMovementService');

const createMovement = async (req, res, next) => {
  try {
    const { productId, movementType, quantity, reason, referenceNumber } = req.body;

    const result = await stockMovementService.recordStockMovement({
      organizationId: req.user.organization_id,
      userId: req.user.id,
      productId,
      movementType,
      quantity,
      reason,
      referenceNumber,
    });

    return res.status(201).json({
      success: true,
      message: 'Stock movement recorded successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMovements = async (req, res, next) => {
  try {
    const { productId, movementType, startDate, endDate, search, page, limit } = req.query;

    const result = await stockMovementService.getStockMovements({
      organizationId: req.user.organization_id,
      productId,
      movementType,
      startDate,
      endDate,
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

const getMovementById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const movement = await stockMovementService.getStockMovementById({
      organizationId: req.user.organization_id,
      id,
    });

    return res.status(200).json({
      success: true,
      data: movement,
    });
  } catch (error) {
    next(error);
  }
};

const getProductMovements = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit } = req.query;

    const result = await stockMovementService.getProductStockMovements({
      organizationId: req.user.organization_id,
      productId,
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

module.exports = {
  createMovement,
  getMovements,
  getMovementById,
  getProductMovements,
};

