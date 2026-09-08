const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      status: 'error',
      message: 'Ya existe un registro con ese valor único',
      data: null,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      message: err.errors.map((e) => e.message).join(', '),
      data: null,
    });
  }

  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      status: 'error',
      message: 'La relación indicada no existe o no es válida',
      data: null,
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
    data: null,
  });
}

module.exports = errorHandler;
