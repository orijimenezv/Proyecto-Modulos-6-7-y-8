const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario, Pedido } = require('../models');
const AppError = require('../utils/AppError');
const sanitizeUser = require('../utils/sanitizeUser');

async function listar({ nombre }) {
  const where = {};
  if (nombre) where.nombre = { [Op.iLike]: `%${nombre}%` };

  return Usuario.findAll({ where, order: [['id', 'ASC']] });
}

async function obtenerPorId(id, incluirPedidos = false) {
  const options = {};
  if (incluirPedidos) {
    options.include = [{ model: Pedido, as: 'pedidos' }];
  }

  const usuario = await Usuario.findByPk(id, options);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  return usuario;
}

async function crear({ nombre, email, password }) {
  if (!nombre || !email || !password) {
    throw new AppError('nombre email y password son obligatorios', 400);
  }
  if (password.length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const creado = await Usuario.unscoped().create({ nombre, email, passwordHash });
  return sanitizeUser(creado);
}

async function actualizar(id, datos) {
  const usuario = await Usuario.unscoped().findByPk(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  const cambios = {};
  if (datos.nombre !== undefined) cambios.nombre = datos.nombre;
  if (datos.email !== undefined) cambios.email = datos.email;
  if (datos.password !== undefined) {
    if (datos.password.length < 6) throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    cambios.passwordHash = await bcrypt.hash(datos.password, 10);
  }

  if (Object.keys(cambios).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', 400);
  }

  await usuario.update(cambios);
  return sanitizeUser(usuario);
}

async function eliminar(id) {
  const usuario = await Usuario.unscoped().findByPk(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  await usuario.destroy();
  return { id: Number(id) };
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
