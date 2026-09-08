require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = Number(process.env.PORT || 3000);

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');

    // Crea/actualiza tablas sin borrarlas.
    await sequelize.sync({ alter: false });
    console.log('✅ Modelos sincronizados');

    app.listen(PORT, () => {
      console.log(`✅ Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

iniciar();
