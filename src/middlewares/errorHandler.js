const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const multer = require('multer');
const AppError = require('../utils/AppError');
module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = 500;
  let message = 'Error interno del servidor';
  if (err instanceof UniqueConstraintError) { status = 409; message = 'Ya existe un registro con ese valor único'; }
  else if (err instanceof ValidationError) { status = 400; message = 'Datos no válidos'; }
  else if (err instanceof ForeignKeyConstraintError) { status = 400; message = 'La relación indicada no es válida'; }
  else if (err instanceof multer.MulterError) { status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400; message = status === 413 ? 'El archivo supera el máximo de 2 MiB' : 'Formulario de archivo no válido'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'JSON no válido'; }
  else if (err.type === 'entity.too.large') { status = 413; message = 'Solicitud demasiado grande'; }
  else if (err instanceof URIError) { status = 400; message = 'URL no válida'; }
  else if (err instanceof AppError && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600) { status = err.statusCode; message = err.message; }
  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(JSON.stringify({ event: 'request_error', requestId: req.requestId, status }));
  res.status(status).json({ status: 'error', message, data: null });
};
