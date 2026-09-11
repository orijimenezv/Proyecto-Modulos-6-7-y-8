const { randomUUID } = require('crypto');
module.exports = function requestLogger(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const start = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') console.log(JSON.stringify({ requestId: req.requestId, method: req.method, status: res.statusCode, durationMs: Date.now() - start }));
  });
  next();
};
