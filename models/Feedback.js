const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Feedback = sequelize.define('Feedback', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'feedback',
  timestamps: false
});

module.exports = Feedback;
