const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define(
  'Organization',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Organization name is required.' },
        len: { args: [2, 100], msg: 'Organization name must be between 2 and 100 characters.' },
      },
    },
    default_low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: { args: [0], msg: 'Default low stock threshold must be at least 0.' },
      },
    },
  },
  {
    tableName: 'organizations',
    timestamps: true,
  }
);

module.exports = Organization;

