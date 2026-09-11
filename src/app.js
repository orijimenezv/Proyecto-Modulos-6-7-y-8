const express = require('express');
const path = require('path');
const { loadConfig } = require('./config/env');
loadConfig();
const app = express();
app.disable('x-powered-by');
app.use(require('./middlewares/requestLogger'));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(require('./middlewares/corsMiddleware'));
app.use(express.json({ limit: '100kb' }));
app.get('/', (req, res) => res.json({ status: 'success', message: 'API de usuarios y pedidos', data: null }));
app.get(['/status', '/health'], (req, res) => res.json({ status: 'success', message: 'Proceso activo; no comprueba la base de datos', data: null }));
// Único estático legado permitido. Nunca exponer directorios de uploads.
app.get('/public/info.html', (req, res) => res.sendFile(path.resolve(__dirname, '../public/info.html')));
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/uploadRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/pedidos', require('./routes/pedidoRoutes'));
app.use((req, res) => res.status(404).json({ status: 'error', message: 'Ruta no encontrada', data: null }));
app.use(require('./middlewares/errorHandler'));
module.exports = app;
