const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Pedido = require('./Pedido');

// Relación 1:N: un usuario puede tener muchos pedidos.
Usuario.hasMany(Pedido, {
  foreignKey: { name: 'usuarioId', allowNull: false },
  as: 'pedidos',
  onDelete: 'CASCADE',
});

Pedido.belongsTo(Usuario, {
  foreignKey: { name: 'usuarioId', allowNull: false },
  as: 'usuario',
  onDelete: 'CASCADE',
});

module.exports = { sequelize, Usuario, Pedido };
