const jwt = require('jsonwebtoken');
const { sequelize, User, Organization } = require('../models');
const env = require('../config/env');

/**
 * Generate a signed JWT for the authenticated user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      organization_id: user.organization_id,
      email: user.email,
      role: user.role,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

/**
 * Registers an organization and initial admin user atomically in a transaction.
 */
async function signup({ organizationName, name, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Execute in database transaction to guarantee tenant integrity
  return await sequelize.transaction(async (t) => {
    // 1. Create Organization
    const organization = await Organization.create(
      {
        name: organizationName.trim(),
        default_low_stock_threshold: 10,
      },
      { transaction: t }
    );

    // 2. Create Admin User
    const user = await User.create(
      {
        organization_id: organization.id,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: password, // handled by User beforeSave hook
        role: 'admin',
      },
      { transaction: t }
    );

    // 3. Generate Token
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        default_low_stock_threshold: organization.default_low_stock_threshold,
      },
    };
  });
}

/**
 * Authenticates user and returns JWT token with user and org context.
 */
async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    where: { email: normalizedEmail },
    include: [{ model: Organization, as: 'organization' }],
  });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      default_low_stock_threshold: user.organization.default_low_stock_threshold,
    },
  };
}

/**
 * Fetches the currently authenticated user's profile and organization
 */
async function getMe(userId, organizationId) {
  const user = await User.findOne({
    where: { id: userId, organization_id: organizationId },
    include: [{ model: Organization, as: 'organization' }],
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      default_low_stock_threshold: user.organization.default_low_stock_threshold,
    },
  };
}

module.exports = {
  signup,
  login,
  getMe,
};

