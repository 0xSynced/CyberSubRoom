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
  type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: function() {
      // Default to lowercase of name if not provided
      return this.name ? this.name.toLowerCase() : 'free';
    }
  }
}, {
  tableName: 'plans',
  timestamps: false
});

module.exports = Plan;
