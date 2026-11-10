const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define(
  'StockMovement',
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
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['IN', 'OUT', 'ADJUSTMENT']],
          msg: "Movement type must be 'IN', 'OUT', or 'ADJUSTMENT'.",
        },
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Quantity must be a non-negative integer.' },
      },
    },
    previous_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    new_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'New stock level cannot be negative.' },
      },
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'stock_movements',
    timestamps: true,
    updatedAt: false, // Stock movements are immutable audit records
    indexes: [
      {
        name: 'idx_movements_org_created',
        fields: ['organization_id', 'created_at'],
      },
      {
        name: 'idx_movements_org_product',
        fields: ['organization_id', 'product_id'],
      },
      {
        name: 'idx_movements_org_type',
        fields: ['organization_id', 'movement_type'],
      },
      {
        name: 'idx_movements_reference',
        fields: ['organization_id', 'reference_number'],
      },
    ],
  }
);

module.exports = StockMovement;

