const settingsService = require('../services/settingsService');

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getOrganizationSettings(req.user.organization_id);
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { name, default_low_stock_threshold } = req.body;
    const updated = await settingsService.updateOrganizationSettings(
      req.user.organization_id,
      { name, default_low_stock_threshold }
    );
    return res.status(200).json({
      success: true,
      message: 'Organization settings updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};

