const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Token no proporcionado',
      data: null
    });
  }

  const token = authorization.split(' ')[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = datos;

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido o expirado',
      data: null
    });
  }
}

module.exports = verificarToken;