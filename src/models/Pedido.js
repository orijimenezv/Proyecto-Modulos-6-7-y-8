const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define(
  'Pedido',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    producto: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
  },
  {
    tableName: 'pedidos',
    timestamps: true,
  }
);

module.exports = Pedido;
