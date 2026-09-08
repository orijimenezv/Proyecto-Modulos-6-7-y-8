const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'log.txt');

function requestLogger(req, res, next) {
  res.on('finish', () => {
    fs.mkdirSync(logDir, { recursive: true });

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString('es-CL');
    const hora = ahora.toLocaleTimeString('es-CL');

    const linea = `${fecha} ${hora} - ${req.method} ${req.originalUrl}\n`;

    fs.appendFile(logFile, linea, 'utf8', (error) => {
      if (error) {
        console.error('No se pudo escribir el log:', error.message);
      }
    });
  });

  next();
}

module.exports = requestLogger;