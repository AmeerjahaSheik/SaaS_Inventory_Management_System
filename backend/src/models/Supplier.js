const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define(
  'Supplier',
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
    supplier_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Supplier name is required.' },
        len: { args: [2, 150], msg: 'Supplier name must be between 2 and 150 characters.' },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isEmailOrEmpty(value) {
          if (value && value.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Please enter a valid email address.');
            }
          }
        },
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'suppliers',
    timestamps: true,
    indexes: [
      {
        name: 'idx_suppliers_org',
        fields: ['organization_id'],
      },
      {
        name: 'idx_suppliers_org_name',
        fields: ['organization_id', 'supplier_name'],
      },
      {
        name: 'idx_suppliers_org_company',
        fields: ['organization_id', 'company_name'],
      },
    ],
  }
);

module.exports = Supplier;
