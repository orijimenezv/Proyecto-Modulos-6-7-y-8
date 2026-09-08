const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'app.log');

function requestLogger(req, res, next) {
  const started = Date.now();

  res.on('finish', () => {
    try {
      fs.mkdirSync(logDir, { recursive: true });
      const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms\n`;
      fs.appendFileSync(logFile, line, 'utf8');
    } catch (error) {
      console.error('No se pudo escribir el log:', error.message);
    }
  });

  next();
}

module.exports = requestLogger;
