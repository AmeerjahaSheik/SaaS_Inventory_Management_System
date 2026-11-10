const { Organization } = require('../models');

async function getOrganizationSettings(organizationId) {
  const org = await Organization.findByPk(organizationId);
  if (!org) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    id: org.id,
    name: org.name,
    default_low_stock_threshold: org.default_low_stock_threshold,
    created_at: org.created_at,
    updated_at: org.updated_at,
  };
}

async function updateOrganizationSettings(organizationId, { name, default_low_stock_threshold }) {
  const org = await Organization.findByPk(organizationId);
  if (!org) {
    const error = new Error('Organization not found.');
    error.statusCode = 404;
    throw error;
  }

  if (name !== undefined) {
    org.name = name.trim();
  }

  if (default_low_stock_threshold !== undefined) {
    const threshold = parseInt(default_low_stock_threshold, 10);
    if (isNaN(threshold) || threshold < 0) {
      const error = new Error('Default low stock threshold must be a non-negative integer.');
      error.statusCode = 400;
      throw error;
    }
    org.default_low_stock_threshold = threshold;
  }

  await org.save();

  return {
    id: org.id,
    name: org.name,
    default_low_stock_threshold: org.default_low_stock_threshold,
    updated_at: org.updated_at,
  };
}

module.exports = {
  getOrganizationSettings,
  updateOrganizationSettings,
};

