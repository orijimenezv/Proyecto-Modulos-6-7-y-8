const { id } = require('../utils/validation');
const AppError = require('../utils/AppError');
module.exports = function owner(req, res, next) {
  try {
    if (id(req.params.id) !== req.usuario.id) throw new AppError('No tienes permiso sobre este recurso', 403);
    next();
  } catch (error) { next(error); }
};
