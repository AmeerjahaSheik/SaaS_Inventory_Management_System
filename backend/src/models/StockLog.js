const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockLog = sequelize.define(
  'StockLog',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    type: {
      type: DataTypes.ENUM('in', 'out', 'adjustment'),
      allowNull: false,
    },
    quantity_change: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    previous_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    new_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'stock_logs',
    timestamps: true,
    updatedAt: false, // Stock logs are immutable audit events
    indexes: [
      {
        name: 'idx_stock_logs_org_created',
        fields: ['organization_id', 'created_at'],
      },
      {
        name: 'idx_stock_logs_product',
        fields: ['product_id'],
      },
    ],
  }
);

module.exports = StockLog;

