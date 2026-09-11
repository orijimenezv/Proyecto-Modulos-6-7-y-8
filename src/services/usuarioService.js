const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario, Pedido, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const sanitizeUser = require('../utils/sanitizeUser');
const v = require('../utils/validation');
function owner(id, actorId) {
  const value = v.id(id);
  if (value !== actorId) throw new AppError('No tienes permiso sobre este recurso', 403);
  return value;
}
async function listar(query, actorId) {
  const { nombre, limit, offset } = v.pagination(query);
  const where = { id: v.id(actorId) };
  if (nombre) where.nombre = { [Op.iLike]: '%' + nombre + '%' };
  return Usuario.findAll({ where, limit, offset, order: [['id', 'ASC']] });
}
async function obtenerPorId(id, incluirPedidos, actorId) {
  const options = {};
  if (incluirPedidos) options.include = [{ model: Pedido, as: 'pedidos' }];
  const usuario = await Usuario.findByPk(owner(id, actorId), options);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  return usuario;
}
async function crear(datos) {
  const { nombre, email, password } = v.usuario(datos);
  const passwordHash = await bcrypt.hash(password, 10);
  return sanitizeUser(await Usuario.unscoped().create({ nombre, email, passwordHash }));
}
async function actualizar(id, datos, actorId) {
  const userId = owner(id, actorId);
  const cambios = v.usuario(datos, true);
  const usuario = await Usuario.unscoped().findByPk(userId);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  if (cambios.password !== undefined) {
    cambios.passwordHash = await bcrypt.hash(cambios.password, 10);
    delete cambios.password;
  }
  await usuario.update(cambios);
  return sanitizeUser(usuario);
}
async function eliminar(id, actorId) {
  const userId = owner(id, actorId);
  return sequelize.transaction(async transaction => {
    const usuario = await Usuario.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!usuario) throw new AppError('Usuario no encontrado', 404);
    // Compatible también con esquemas anteriores; todas las eliminaciones son atómicas.
    await Pedido.destroy({ where: { usuarioId: userId }, transaction });
    await usuario.destroy({ transaction });
    return { id: userId };
  });
}
module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
