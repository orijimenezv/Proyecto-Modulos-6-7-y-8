const usuarioService = require('../services/usuarioService');
const rawSqlService = require('../services/rawSqlService');
const transaccionService = require('../services/transaccionService');

async function listar(req, res, next) {
  try {
    const usuarios = await usuarioService.listar({ nombre: req.query.nombre });
    res.json({ status: 'success', message: 'Usuarios obtenidos', data: usuarios });
  } catch (error) { next(error); }
}

async function listarSQL(req, res, next) {
  try {
    const usuarios = await rawSqlService.listarUsuariosSQL(req.query.nombre);
    res.json({ status: 'success', message: 'Usuarios obtenidos con SQL manual', data: usuarios });
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const usuario = await usuarioService.obtenerPorId(req.params.id);
    res.json({ status: 'success', message: 'Usuario obtenido', data: usuario });
  } catch (error) { next(error); }
}

async function detalles(req, res, next) {
  try {
    const usuario = await usuarioService.obtenerPorId(req.params.id, true);
    res.json({ status: 'success', message: 'Usuario y pedidos obtenidos', data: usuario });
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const usuario = await usuarioService.crear(req.body);
    res.status(201).json({ status: 'success', message: 'Usuario creado', data: usuario });
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const usuario = await usuarioService.actualizar(req.params.id, req.body);
    res.json({ status: 'success', message: 'Usuario actualizado', data: usuario });
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    const data = await usuarioService.eliminar(req.params.id);
    res.json({ status: 'success', message: 'Usuario eliminado y pedidos relacionados eliminados en cascada', data });
  } catch (error) { next(error); }
}

async function transaccion(req, res, next) {
  try {
    const data = await transaccionService.crearUsuarioConPedido(req.body);
    res.status(201).json({ status: 'success', message: 'Transacción confirmada con COMMIT', data });
  } catch (error) { next(error); }
}

module.exports = { listar, listarSQL, obtener, detalles, crear, actualizar, eliminar, transaccion };
