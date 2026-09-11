const AppError = require('../utils/AppError');
// Límite por proceso; varias instancias necesitan un contador compartido.
module.exports = function rateLimit({ limit = 10, windowMs = 15 * 60 * 1000 } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of clients) if (entry.until <= now) clients.delete(key);
    const key = req.ip;
    let entry = clients.get(key);
    if (!entry) {
      if (clients.size >= 10000) return next(new AppError('Demasiadas solicitudes', 429));
      entry = { count: 0, until: now + windowMs };
      clients.set(key, entry);
    }
    entry.count++;
    if (entry.count > limit) {
      res.setHeader('Retry-After', Math.ceil((entry.until - now) / 1000));
      return next(new AppError('Demasiados intentos; intenta más tarde', 429));
    }
    next();
  };
};
