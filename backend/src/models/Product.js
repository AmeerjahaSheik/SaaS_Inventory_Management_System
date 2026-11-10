const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define(
  'Product',
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
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required.' },
        len: { args: [2, 150], msg: 'Product name must be between 2 and 150 characters.' },
      },
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'SKU is required.' },
        len: { args: [1, 50], msg: 'SKU must be between 1 and 50 characters.' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: { args: [0], msg: 'Price must be greater than or equal to 0.' },
      },
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
      validate: {
        min: { args: [0], msg: 'Cost price must be greater than or equal to 0.' },
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Quantity cannot be negative.' },
      },
    },
    low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Low stock threshold must be at least 0.' },
      },
    },
  },
  {
    tableName: 'products',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_org_sku',
        fields: ['organization_id', 'sku'],
      },
      {
        name: 'idx_org_quantity',
        fields: ['organization_id', 'quantity'],
      },
      {
        name: 'idx_org_category',
        fields: ['organization_id', 'category'],
      },
    ],
  }
);

module.exports = Product;

