// Datos sintéticos opcionales. Nunca crea, sincroniza, borra ni recrea tablas.
const { loadConfig } = require('./config/env');
async function seed() {
  const config = loadConfig();
  if (config.mode === 'production' || process.env.SEED_ALLOW_EMPTY_DATABASE !== 'true') throw new Error('Seed bloqueado; solo base vacía de desarrollo/pruebas con autorización explícita');
  const v = require('./utils/validation');
  const password = v.password(process.env.SEED_PASSWORD);
  const { sequelize, Usuario, Pedido } = require('./models');
  try {
    const passwordHash = await require('bcryptjs').hash(password, 10);
    await sequelize.transaction(async transaction => {
      await sequelize.query('LOCK TABLE usuarios, pedidos IN ACCESS EXCLUSIVE MODE', { transaction });
      if (await Usuario.count({ transaction }) || await Pedido.count({ transaction })) throw new Error('Seed bloqueado: existen datos');
      const usuario = await Usuario.unscoped().create({ nombre: 'Cuenta Demo', email: 'demo@example.invalid', passwordHash }, { transaction });
      await Pedido.create({ usuarioId: usuario.id, producto: 'Producto Demo', cantidad: 1, total: '10.00', estado: 'pendiente' }, { transaction });
    });
    console.log('Datos sintéticos creados');
  } finally { await sequelize.close(); }
}
if (require.main === module) seed().catch(() => { console.error('Seed no realizado. Revisa las condiciones documentadas.'); process.exitCode = 1; });
module.exports = { seed };
