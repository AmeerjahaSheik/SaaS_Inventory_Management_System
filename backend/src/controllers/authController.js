const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    const { organizationName, name, email, password } = req.body;
    const result = await authService.signup({ organizationName, name, email, password });
    return res.status(201).json({
      success: true,
      message: 'Organization and account created successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.id, req.user.organization_id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  me,
};

