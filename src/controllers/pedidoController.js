const pedidoService = require('../services/pedidoService');

async function listar(req, res, next) {
  try {
    const data = await pedidoService.listar(req.usuario.id, req.query);
    res.json({ status: 'success', message: 'Pedidos obtenidos', data });
  } catch (error) { next(error); }
}

async function obtener(req, res, next) {
  try {
    const data = await pedidoService.obtenerPorId(req.params.id, req.usuario.id);
    res.json({ status: 'success', message: 'Pedido obtenido', data });
  } catch (error) { next(error); }
}

async function crear(req, res, next) {
  try {
    const data = await pedidoService.crear(req.body, req.usuario.id);
    res.status(201).json({ status: 'success', message: 'Pedido creado', data });
  } catch (error) { next(error); }
}

async function actualizar(req, res, next) {
  try {
    const data = await pedidoService.actualizar(req.params.id, req.body, req.usuario.id);
    res.json({ status: 'success', message: 'Pedido actualizado', data });
  } catch (error) { next(error); }
}

async function eliminar(req, res, next) {
  try {
    const data = await pedidoService.eliminar(req.params.id, req.usuario.id);
    res.json({ status: 'success', message: 'Pedido eliminado', data });
  } catch (error) { next(error); }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
