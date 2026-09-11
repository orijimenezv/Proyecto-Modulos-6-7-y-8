const { Pedido } = require('../models');
const AppError = require('../utils/AppError');
const v = require('../utils/validation');
async function listar(actorId, query) {
  const { limit, offset } = v.pagination(query);
  return Pedido.findAll({ where: { usuarioId: v.id(actorId) }, limit, offset, order: [['id', 'ASC']] });
}
async function obtenerPorId(id, actorId) {
  const pedido = await Pedido.findOne({ where: { id: v.id(id), usuarioId: v.id(actorId) } });
  if (!pedido) throw new AppError('Pedido no encontrado', 404);
  return pedido;
}
function fields(datos, actorId, partial) {
  const result = v.pedido(datos, partial);
  if (result.usuarioId !== undefined && result.usuarioId !== actorId) throw new AppError('No puedes asignar pedidos a otro usuario', 403);
  delete result.usuarioId;
  return result;
}
async function crear(datos, actorId) {
  return Pedido.create({ ...fields(datos, actorId, false), usuarioId: v.id(actorId) });
}
async function actualizar(id, datos, actorId) {
  const changes = fields(datos, actorId, true);
  const pedido = await obtenerPorId(id, actorId);
  await pedido.update(changes);
  return pedido;
}
async function eliminar(id, actorId) {
  const pedido = await obtenerPorId(id, actorId);
  await pedido.destroy();
  return { id: Number(id) };
}
module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
