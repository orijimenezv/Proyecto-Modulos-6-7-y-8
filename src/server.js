const { loadConfig } = require('./config/env');
const app = require('./app');
const { sequelize } = require('./models');
async function iniciar() {
  await sequelize.authenticate();
  // El esquema se administra exclusivamente mediante migraciones autorizadas.
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(loadConfig().port, () => {
      listener.removeListener('error', reject);
      console.log('Servidor HTTP iniciado');
      resolve(listener);
    });
    listener.once('error', reject);
  });
  const shutdown = () => {
    server.close(() => sequelize.close().catch(() => { process.exitCode = 1; }));
    server.closeIdleConnections?.();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return server;
}
module.exports = { iniciar };
