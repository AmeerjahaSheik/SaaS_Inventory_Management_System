const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrder = sequelize.define(
  'PurchaseOrder',
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
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'ORDERED',
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expected_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    notes: {
      type: DataTypes.TEXT,
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
    tableName: 'purchase_orders',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'unique_org_po_number',
        fields: ['organization_id', 'po_number'],
      },
      {
        name: 'idx_po_org_supplier',
        fields: ['organization_id', 'supplier_id'],
      },
      {
        name: 'idx_po_org_status',
        fields: ['organization_id', 'status'],
      },
    ],
  }
);

module.exports = PurchaseOrder;
