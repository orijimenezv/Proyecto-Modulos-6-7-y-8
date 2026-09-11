const { loadConfig } = require('../config/env');
const AppError = require('../utils/AppError');
module.exports = function cors(req, res, next) {
  res.vary('Origin');
  const origin = req.headers.origin;
  if (!origin) return next();
  if (!loadConfig().origins.includes(origin)) return next(new AppError('Origen no permitido', 403));
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (req.method === 'OPTIONS') {
    res.vary('Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.sendStatus(204);
  }
  next();
};
