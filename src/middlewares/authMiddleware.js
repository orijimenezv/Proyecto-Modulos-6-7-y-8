const { Usuario } = require('../models');
const tokens = require('../utils/tokens');
const AppError = require('../utils/AppError');
module.exports = async function verificarToken(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return next(new AppError('Token no proporcionado', 401));
  let payload;
  try { payload = tokens.verify(match[1]); }
  catch { return next(new AppError('Token inválido o expirado', 401)); }
  try {
    const usuario = await Usuario.scope('conPassword').findByPk(payload.id);
    if (!usuario || payload.cv !== tokens.credentialVersion(usuario.passwordHash)) return next(new AppError('Sesión no válida; inicia sesión nuevamente', 401));
    req.usuario = { id: usuario.id };
    next();
  } catch (error) { next(error); }
};
