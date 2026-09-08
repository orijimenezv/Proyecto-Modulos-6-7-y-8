const { Pedido, Usuario } = require('../models');
const AppError = require('../utils/AppError');

async function listar() {
  return Pedido.findAll({
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
    order: [['id', 'ASC']],
  });
}

async function obtenerPorId(id) {
  const pedido = await Pedido.findByPk(id, {
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
  });
  if (!pedido) throw new AppError('Pedido no encontrado', 404);
  return pedido;
}

async function crear(datos) {
  const { usuarioId, producto, cantidad, total, estado } = datos;
  if (!usuarioId || !producto || cantidad === undefined || total === undefined) {
    throw new AppError('usuarioId producto cantidad y total son obligatorios', 400);
  }

  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) throw new AppError('El usuario asociado no existe', 400);

  return Pedido.create({ usuarioId, producto, cantidad, total, estado });
}

async function actualizar(id, datos) {
  const pedido = await Pedido.findByPk(id);
  if (!pedido) throw new AppError('Pedido no encontrado', 404);

  const permitidos = ['producto', 'cantidad', 'total', 'estado'];
  const cambios = {};
  for (const campo of permitidos) {
    if (datos[campo] !== undefined) cambios[campo] = datos[campo];
  }

  if (Object.keys(cambios).length === 0) throw new AppError('No hay campos válidos para actualizar', 400);
  await pedido.update(cambios);
  return pedido;
}

async function eliminar(id) {
  const pedido = await Pedido.findByPk(id);
  if (!pedido) throw new AppError('Pedido no encontrado', 404);
  await pedido.destroy();
  return { id: Number(id) };
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
