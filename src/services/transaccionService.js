const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Pedido } = require('../models');
const AppError = require('../utils/AppError');
const sanitizeUser = require('../utils/sanitizeUser');

async function crearUsuarioConPedido({ usuario, pedido, forzarError = false }) {
  if (!usuario?.nombre || !usuario?.email || !usuario?.password || !pedido?.producto) {
    throw new AppError('Debes enviar datos válidos de usuario y pedido', 400);
  }

  const transaction = await sequelize.transaction();

  try {
    const passwordHash = await bcrypt.hash(usuario.password, 10);

    const nuevoUsuario = await Usuario.unscoped().create(
      {
        nombre: usuario.nombre,
        email: usuario.email,
        passwordHash,
      },
      { transaction }
    );

    const nuevoPedido = await Pedido.create(
      {
        usuarioId: nuevoUsuario.id,
        producto: pedido.producto,
        cantidad: pedido.cantidad,
        total: pedido.total,
        estado: pedido.estado || 'pendiente',
      },
      { transaction }
    );

    if (forzarError) {
      throw new Error('Error forzado para demostrar ROLLBACK');
    }

    await transaction.commit();
    console.log('TRANSACCIÓN OK: usuario y pedido creados');

    return { usuario: sanitizeUser(nuevoUsuario), pedido: nuevoPedido };
  } catch (error) {
    await transaction.rollback();
    console.error('TRANSACCIÓN ROLLBACK:', error.message);
    throw error;
  }
}

module.exports = { crearUsuarioConPedido };
