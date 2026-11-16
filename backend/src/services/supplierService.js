const { Op } = require('sequelize');
const { Supplier, PurchaseOrder } = require('../models');

/**
 * Fetch all suppliers for an organization with optional search and pagination.
 */
async function getSuppliers({ organizationId, search = '', page = 1, limit = 20 }) {
  const where = {
    organization_id: organizationId,
  };

  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { supplier_name: { [Op.like]: term } },
      { company_name: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { phone: { [Op.like]: term } },
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await Supplier.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    suppliers: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit) || 1,
    },
  };
}

/**
 * Fetch a single supplier by ID ensuring multi-tenant isolation.
 */
async function getSupplierById({ organizationId, supplierId }) {
  const supplier = await Supplier.findOne({
    where: {
      id: supplierId,
      organization_id: organizationId,
    },
  });

  if (!supplier) {
    const error = new Error('Supplier not found.');
    error.status = 404;
    throw error;
  }

  return supplier;
}

/**
 * Create a new supplier strictly associated with the authenticated organization.
 */
async function createSupplier({ organizationId, data }) {
  const { supplier_name, email, phone, company_name, address, notes } = data;

  const supplier = await Supplier.create({
    organization_id: organizationId,
    supplier_name: supplier_name.trim(),
    email: email && email.trim() !== '' ? email.trim() : null,
    phone: phone && phone.trim() !== '' ? phone.trim() : null,
    company_name: company_name && company_name.trim() !== '' ? company_name.trim() : null,
    address: address && address.trim() !== '' ? address.trim() : null,
    notes: notes && notes.trim() !== '' ? notes.trim() : null,
  });

  return supplier;
}

/**
 * Update an existing supplier.
 */
async function updateSupplier({ organizationId, supplierId, data }) {
  const supplier = await getSupplierById({ organizationId, supplierId });

  const { supplier_name, email, phone, company_name, address, notes } = data;

  if (supplier_name !== undefined) supplier.supplier_name = supplier_name.trim();
  if (email !== undefined) supplier.email = email && email.trim() !== '' ? email.trim() : null;
  if (phone !== undefined) supplier.phone = phone && phone.trim() !== '' ? phone.trim() : null;
  if (company_name !== undefined) {
    supplier.company_name = company_name && company_name.trim() !== '' ? company_name.trim() : null;
  }
  if (address !== undefined) supplier.address = address && address.trim() !== '' ? address.trim() : null;
  if (notes !== undefined) supplier.notes = notes && notes.trim() !== '' ? notes.trim() : null;

  await supplier.save();
  return supplier;
}

/**
 * Delete a supplier.
 */
async function deleteSupplier({ organizationId, supplierId }) {
  const supplier = await getSupplierById({ organizationId, supplierId });

  // Check if supplier is linked to any purchase orders
  const linkedOrdersCount = await PurchaseOrder.count({
    where: {
      supplier_id: supplierId,
      organization_id: organizationId,
    },
  });

  if (linkedOrdersCount > 0) {
    const error = new Error('Cannot delete supplier because purchase orders are linked to this supplier.');
    error.status = 400;
    throw error;
  }

  await supplier.destroy();
  return { message: 'Supplier deleted successfully.' };
}

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
