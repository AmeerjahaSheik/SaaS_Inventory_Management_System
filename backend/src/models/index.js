const { sequelize, ensureDatabaseExists } = require('../config/database');
const Organization = require('./Organization');
const User = require('./User');
const Product = require('./Product');
const StockLog = require('./StockLog');

// Define Relationships
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users', onDelete: 'CASCADE' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Organization.hasMany(Product, { foreignKey: 'organization_id', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Organization.hasMany(StockLog, { foreignKey: 'organization_id', as: 'stockLogs', onDelete: 'CASCADE' });
StockLog.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Product.hasMany(StockLog, { foreignKey: 'product_id', as: 'stockLogs', onDelete: 'CASCADE' });
StockLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

User.hasMany(StockLog, { foreignKey: 'user_id', as: 'stockLogs', onDelete: 'SET NULL' });
StockLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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
};

