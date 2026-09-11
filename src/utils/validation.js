const AppError = require('./AppError');
const fail = message => { throw new AppError(message, 400); };
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('Se requiere un objeto JSON');
  return value;
}
function keys(value, allowed) {
  object(value);
  if (Object.keys(value).some(key => !allowed.includes(key))) fail('Hay campos no permitidos');
}
function id(value) {
  if (!['string', 'number'].includes(typeof value)) fail('ID no válido');
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) fail('ID no válido');
  return Number(value);
}
function text(value, field, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(field + ' no válido');
  return value.trim();
}
function email(value) {
  const result = text(value, 'email', 3, 120);
  if (!require('sequelize').Validator.isEmail(result)) fail('email no válido');
  return result;
}
function password(value, login = false) {
  if (typeof value !== 'string' || value.length < (login ? 1 : 8) || Buffer.byteLength(value, 'utf8') > 72) fail('La contraseña debe tener entre 8 caracteres y 72 bytes');
  return value;
}
function usuario(value, partial = false) {
  keys(value, ['nombre', 'email', 'password']);
  const result = {};
  if (!partial || value.nombre !== undefined) result.nombre = text(value.nombre, 'nombre', 2, 80);
  if (!partial || value.email !== undefined) result.email = email(value.email);
  if (!partial || value.password !== undefined) result.password = password(value.password);
  if (!Object.keys(result).length) fail('No hay campos para actualizar');
  return result;
}
function pedido(value, partial = false) {
  keys(value, ['usuarioId', 'producto', 'cantidad', 'total', 'estado']);
  const result = {};
  if (value.usuarioId !== undefined) result.usuarioId = id(value.usuarioId);
  if (!partial || value.producto !== undefined) result.producto = text(value.producto, 'producto', 1, 120);
  if (!partial || value.cantidad !== undefined) {
    if (!Number.isInteger(value.cantidad) || value.cantidad < 1 || value.cantidad > 2147483647) fail('cantidad debe ser un entero positivo');
    result.cantidad = value.cantidad;
  }
  if (!partial || value.total !== undefined) {
    if (!['number', 'string'].includes(typeof value.total) || !/^\d{1,10}(\.\d{1,2})?$/.test(String(value.total))) fail('total debe ser un importe no negativo con hasta dos decimales');
    result.total = value.total;
  }
  if (value.estado !== undefined) {
    if (!['pendiente', 'pagado', 'cancelado'].includes(value.estado)) fail('estado no válido');
    result.estado = value.estado;
  }
  if (partial && !Object.keys(result).some(key => key !== 'usuarioId')) fail('No hay campos para actualizar');
  return result;
}
function pagination(query = {}) {
  keys(query, ['limit', 'offset', 'nombre']);
  if (['limit', 'offset'].some(key => query[key] !== undefined && !['string', 'number'].includes(typeof query[key]))) fail('Paginación no válida');
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if ((query.limit !== undefined && !/^\d+$/.test(String(query.limit))) || !Number.isInteger(limit) || limit < 1 || limit > 100) fail('limit debe estar entre 1 y 100');
  if ((query.offset !== undefined && !/^\d+$/.test(String(query.offset))) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) fail('offset no válido');
  return { limit, offset, nombre: query.nombre === undefined ? undefined : text(query.nombre, 'nombre', 1, 80) };
}
module.exports = { object, keys, id, text, email, password, usuario, pedido, pagination };
