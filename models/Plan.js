const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Plan = sequelize.define('Plan', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'plans',
  timestamps: false
});

module.exports = Plan;
