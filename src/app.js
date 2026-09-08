const express = require('express');
const path = require('path');

const usuarioRoutes = require('./routes/usuarioRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

app.use(express.json());

app.use(requestLogger);

// Archivos estáticos del Módulo 6
app.use('/public', express.static(path.join(__dirname, '../public')));

// Ruta principal - respuesta HTML
app.get('/', (req, res) => {
  res.send(`
    <h1>Proyecto Node & Express Web App</h1>
    <p>Servidor funcionando correctamente</p>
    <p>Proyecto integrador módulos 6 7 y 8</p>
  `);
});

// Ruta de estado - respuesta JSON
app.get('/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servidor activo',
    data: null
  });
});

// La dejamos para no eliminar nada del proyecto anterior
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Servidor activo',
    data: null
  });
});

// Rutas del Módulo 7
app.use('/', authRoutes);
app.use('/', uploadRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada',
    data: null
  });
});

app.use(errorHandler);

module.exports = app;