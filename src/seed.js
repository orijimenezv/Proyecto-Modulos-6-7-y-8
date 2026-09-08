require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Pedido } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const passwordHash = await bcrypt.hash('clave123', 10);

    const usuarios = await Usuario.unscoped().bulkCreate([
      { nombre: 'Ana Torres', email: 'ana@ejemplo.cl', passwordHash },
      { nombre: 'Juan Pérez', email: 'juan@ejemplo.cl', passwordHash },
      { nombre: 'Camila Soto', email: 'camila@ejemplo.cl', passwordHash },
    ], { returning: true });

    await Pedido.bulkCreate([
      { usuarioId: usuarios[0].id, producto: 'Teclado', cantidad: 1, total: 25990, estado: 'pagado' },
      { usuarioId: usuarios[0].id, producto: 'Mouse', cantidad: 2, total: 19980, estado: 'pendiente' },
      { usuarioId: usuarios[1].id, producto: 'Audífonos', cantidad: 1, total: 32990, estado: 'pagado' },
    ]);

    console.log('✅ Datos de prueba creados: 3 usuarios y 3 pedidos');
  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
