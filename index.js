require('./src/server').iniciar().catch(async () => {
  console.error('No se pudo iniciar el servidor. Revisa configuración y conectividad.');
  await require('./src/models').sequelize.close();
  process.exitCode = 1;
});
