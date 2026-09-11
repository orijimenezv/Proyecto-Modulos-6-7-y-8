const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { QueryTypes } = require('sequelize');
const migrationName = '001-initial.sql';
async function migrate(sequelize, env = process.env) {
  if (env.MIGRATION_ALLOW_EMPTY_DATABASE !== 'true') throw new Error('Se requiere MIGRATION_ALLOW_EMPTY_DATABASE=true para una base nueva y vacía');
  const sql = fs.readFileSync(path.resolve(__dirname, '../migrations', migrationName), 'utf8');
  const checksum = createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex');
  return sequelize.transaction(async transaction => {
    const select = query => sequelize.query(query, { transaction, type: QueryTypes.SELECT });
    await sequelize.query('SELECT pg_advisory_xact_lock(701001)', { transaction });
    const tables = await select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    if (tables.some(row => row.tablename === 'schema_migrations')) {
      const applied = await select('SELECT name, checksum FROM public.schema_migrations');
      if (applied.length === 1 && applied[0].name === migrationName && applied[0].checksum === checksum && ['usuarios', 'pedidos'].every(name => tables.some(t => t.tablename === name))) return 'Sin migraciones pendientes';
      throw new Error('Historial de migraciones distinto del esperado; requiere revisión manual');
    }
    if (tables.length) throw new Error('Base existente detectada: no se ejecutó DDL. Requiere diagnóstico y autorización de adopción');
    await sequelize.query('CREATE TABLE public.schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())', { transaction });
    await sequelize.query(sql, { transaction });
    await sequelize.query('INSERT INTO public.schema_migrations (name, checksum) VALUES ($name, $checksum)', { transaction, bind: { name: migrationName, checksum } });
    return 'Migración inicial aplicada';
  });
}
if (require.main === module) {
  // La importación de configuración no ejecuta conexiones por sí sola.
  const sequelize = require('../src/config/database');
  migrate(sequelize).then(message => console.log(message)).catch(() => {
    console.error('Migración no aplicada. Revisa autorización, base vacía, configuración e historial.');
    process.exitCode = 1;
  }).finally(() => sequelize.close());
}
module.exports = { migrate };
