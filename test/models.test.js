const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV='test';process.env.JWT_SECRET=require('node:crypto').randomBytes(48).toString('hex');
process.env.DB_NAME='unused_test';process.env.DB_USER='synthetic';process.env.DB_PASSWORD='synthetic';delete process.env.DATABASE_URL;process.env.DB_SSL='false';process.env.STORAGE_DRIVER='local';
require('pg').Client.prototype.connect=function(){throw new Error('REAL_DATABASE_ACCESS_FORBIDDEN')};
const {Usuario,Pedido,sequelize}=require('../src/models');
test('modelos reales definen FK obligatoria y cascada sin hooks de eliminación',()=>{
  assert.equal(Pedido.rawAttributes.usuarioId.allowNull,false);
  assert.equal(Pedido.rawAttributes.usuarioId.onDelete,'CASCADE');
  assert.equal(Usuario.associations.pedidos.options.useHooks,false);
  assert.ok(Usuario.options.defaultScope.attributes.exclude.includes('passwordHash'));
});
test('validación real Sequelize sin conexión rechaza datos inválidos',async()=>{
  await assert.rejects(Usuario.build({nombre:'x',email:'bad',passwordHash:'synthetic'}).validate());
  await assert.rejects(Pedido.build({producto:'x',cantidad:0,total:-1,usuarioId:1}).validate());
  await assert.rejects(Pedido.build({producto:'x',cantidad:1,total:1}).validate());
  await Pedido.build({producto:'x',cantidad:1,total:'1.00',usuarioId:1}).validate();
});
test('configuración del pool real respeta el máximo y puede cerrarse sin conectar',async()=>{
  assert.equal(sequelize.options.pool.max,2);await sequelize.close();
});
