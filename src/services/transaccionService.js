const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Pedido } = require('../models');
const v = require('../utils/validation');
const sanitizeUser = require('../utils/sanitizeUser');
async function crearUsuarioConPedido(datos) {
  v.keys(datos, ['usuario', 'pedido']);
  const { password, ...usuario } = v.usuario(datos.usuario);
  v.keys(datos.pedido, ['producto', 'cantidad', 'total', 'estado']);
  const pedido = v.pedido(datos.pedido);
  const passwordHash = await bcrypt.hash(password, 10);
  // Sequelize confirma con COMMIT o revierte con ROLLBACK al rechazar el callback.
  return sequelize.transaction(async transaction => {
    const nuevoUsuario = await Usuario.unscoped().create({ ...usuario, passwordHash }, { transaction });
    const nuevoPedido = await Pedido.create({ ...pedido, usuarioId: nuevoUsuario.id }, { transaction });
    return { usuario: sanitizeUser(nuevoUsuario), pedido: nuevoPedido };
  });
}
module.exports = { crearUsuarioConPedido };
