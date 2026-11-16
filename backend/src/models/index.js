const { sequelize, ensureDatabaseExists } = require('../config/database');
const Organization = require('./Organization');
const User = require('./User');
const Product = require('./Product');
const StockLog = require('./StockLog');
const StockMovement = require('./StockMovement');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');

// User & Organization
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users', onDelete: 'CASCADE' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// Product & Organization
Organization.hasMany(Product, { foreignKey: 'organization_id', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// StockLog
Organization.hasMany(StockLog, { foreignKey: 'organization_id', as: 'stockLogs', onDelete: 'CASCADE' });
StockLog.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Product.hasMany(StockLog, { foreignKey: 'product_id', as: 'stockLogs', onDelete: 'CASCADE' });
StockLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(StockLog, { foreignKey: 'user_id', as: 'stockLogs', onDelete: 'SET NULL' });
StockLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// StockMovement
Organization.hasMany(StockMovement, { foreignKey: 'organization_id', as: 'stockMovements', onDelete: 'CASCADE' });
StockMovement.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'stockMovements', onDelete: 'CASCADE' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(StockMovement, { foreignKey: 'created_by', as: 'stockMovements', onDelete: 'SET NULL' });
StockMovement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Supplier & Organization
Organization.hasMany(Supplier, { foreignKey: 'organization_id', as: 'suppliers', onDelete: 'CASCADE' });
Supplier.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// Purchase Orders & Items
Organization.hasMany(PurchaseOrder, { foreignKey: 'organization_id', as: 'purchaseOrders', onDelete: 'CASCADE' });
PurchaseOrder.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchaseOrders', onDelete: 'RESTRICT' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });

Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id', as: 'poItems', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'purchaseOrders', onDelete: 'SET NULL' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

/**
 * Initializes MySQL database and syncs Sequelize models.
 * @param {boolean} alter - Whether to alter tables to match models
 */
async function initializeDatabase(alter = false) {
  await ensureDatabaseExists();
  await sequelize.authenticate();
  console.log('[Database] MySQL connection established successfully.');
  await sequelize.sync({ alter });
  console.log('[Database] All Sequelize models synchronized successfully.');
}

module.exports = {
  sequelize,
  initializeDatabase,
  Organization,
  User,
  Product,
  StockLog,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
};
