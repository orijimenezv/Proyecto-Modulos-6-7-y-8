const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Pedido = require('./Pedido');

// Relación 1:N: un usuario puede tener muchos pedidos.
Usuario.hasMany(Pedido, {
  foreignKey: 'usuarioId',
  as: 'pedidos',
  onDelete: 'CASCADE',
  hooks: true,
});

Pedido.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'usuario',
});

module.exports = { sequelize, Usuario, Pedido };
