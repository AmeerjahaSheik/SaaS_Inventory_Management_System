const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User, Organization } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);

    // Ensure token contains required tenant and user identities
    if (!decoded.id || !decoded.organization_id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload: missing organization context.',
      });
    }

    // Attach verified user context to request
    req.user = {
      id: decoded.id,
      organization_id: decoded.organization_id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged token.',
    });
  }
};

module.exports = authenticate;

