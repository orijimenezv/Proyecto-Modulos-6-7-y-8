const express = require('express');
const usuarioRoutes = require('./routes/usuarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Proyecto Módulo 7 - Node Express PostgreSQL Sequelize',
    data: {
      endpoints: ['/api/usuarios', '/api/pedidos', '/api/usuarios/:id/detalles'],
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'Servidor activo', data: null });
});

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada', data: null });
});

app.use(errorHandler);

module.exports = app;
