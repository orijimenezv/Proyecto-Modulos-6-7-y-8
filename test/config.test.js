const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
process.env.NODE_ENV = 'test';
const { loadConfig } = require('../src/config/env');
const base = { NODE_ENV: 'test', JWT_SECRET: randomBytes(48).toString('hex'), DB_NAME: 'synthetic', DB_USER: 'synthetic', DB_PASSWORD: 'synthetic' };
test('config exige secreto explícito y rechaza placeholder, wildcard y entornos inválidos', () => {
  for (const extra of [{ JWT_SECRET: '' }, { JWT_SECRET: 'corto' }, { JWT_SECRET: 'reemplazar_' + 'x'.repeat(40) }, { CORS_ORIGINS: '*' }, { NODE_ENV: 'invalid' }, { DB_POOL_MAX: '100' }, { DB_SSL: 'maybe' }]) assert.throws(() => loadConfig({ ...base, ...extra }));
});
test('producción exige TLS, CORS HTTPS y almacenamiento deshabilitado', () => {
  const production = { ...base, NODE_ENV: 'production', DB_SSL: 'true', CORS_ORIGINS: 'https://demo.github.io' };
  const config=loadConfig(production); assert.equal(config.storage.driver,'disabled'); assert.equal(config.database.ssl.rejectUnauthorized,true);
  for(const extra of [{DB_SSL:'false'},{CORS_ORIGINS:''},{CORS_ORIGINS:'http://example.invalid'},{STORAGE_DRIVER:'local'}]) assert.throws(()=>loadConfig({...production,...extra}));
});
test('DATABASE_URL válida y TLS centralizado sin overrides',()=>{
  const url='postgresql://synthetic:synthetic@localhost:5432/test';
  assert.equal(loadConfig({...base,DATABASE_URL:url}).database.url,url);
  assert.throws(()=>loadConfig({...base,DATABASE_URL:url+'?sslmode=no-verify'}));
  assert.throws(()=>loadConfig({...base,DATABASE_URL:'https://example.invalid'}));
  assert.equal(loadConfig({...base,DB_SSL:'true',DB_SSL_CA:'line1'+String.fromCharCode(92)+'nline2'}).database.ssl.ca,'line1'+String.fromCharCode(10)+'line2');
});
test('origen CORS no permite rutas, credenciales ni coincidencias parciales',()=>{
  for(const origin of ['https://demo.github.io/repo/','https://user:pass@example.invalid','https://demo.github.io/']) assert.throws(()=>loadConfig({...base,CORS_ORIGINS:origin}));
});
test('límite de intentos devuelve 429 y permite nuevo intervalo',()=>{
  const limit=require('../src/middlewares/rateLimit')({limit:2,windowMs:100});
  const original=Date.now; let now=1000; Date.now=()=>now;
  const headers={};const res={setHeader(k,v){headers[k]=v}};let err;
  try{for(let i=0;i<3;i++)limit({ip:'synthetic'},res,e=>err=e);assert.equal(err.statusCode,429);assert.equal(headers['Retry-After'],1);now=1101;limit({ip:'synthetic'},res,e=>err=e);assert.equal(err,undefined)}finally{Date.now=original}
});
test('migración no toca BD sin autorización explícita',async()=>{
  const {migrate}=require('../scripts/migrate');let called=false;
  await assert.rejects(migrate({transaction(){called=true}},{}));assert.equal(called,false);
});
test('migración rechaza esquema existente antes de ejecutar DDL',async()=>{
  const {migrate}=require('../scripts/migrate');const queries=[];
  const db={transaction:fn=>fn({}),async query(sql){queries.push(sql);return sql.includes('pg_tables')?[{tablename:'usuarios'}]:[]}};
  await assert.rejects(migrate(db,{MIGRATION_ALLOW_EMPTY_DATABASE:'true'}),/Base existente/);
  assert.ok(!queries.some(sql=>/CREATE|DROP|ALTER|INSERT/.test(sql)));
});
test('migración inicial en simulación usa una transacción y guarda checksum',async()=>{
  const {migrate}=require('../scripts/migrate');const tx={synthetic:true};const queries=[];
  const db={transaction:fn=>fn(tx),async query(sql,options){assert.equal(options.transaction,tx);queries.push({sql,options});return []}};
  assert.equal(await migrate(db,{MIGRATION_ALLOW_EMPTY_DATABASE:'true'}),'Migración inicial aplicada');
  assert.ok(queries.some(x=>x.sql.includes('CREATE TABLE public.pedidos')));assert.match(queries.at(-1).options.bind.checksum,/^[0-9a-f]{64}$/);
});
test('migración ya registrada con checksum no ejecuta DDL',async()=>{
  const {migrate}=require('../scripts/migrate');const fs=require('node:fs');const crypto=require('node:crypto');
  const checksum=crypto.createHash('sha256').update(fs.readFileSync(require('node:path').resolve(__dirname,'../migrations/001-initial.sql'),'utf8').replace(/\r\n/g,'\n')).digest('hex');
  const queries=[];const db={transaction:fn=>fn({}),async query(sql){queries.push(sql);if(sql.includes('pg_tables'))return ['usuarios','pedidos','schema_migrations'].map(tablename=>({tablename}));if(sql.startsWith('SELECT name'))return [{name:'001-initial.sql',checksum}];return []}};
  assert.equal(await migrate(db,{MIGRATION_ALLOW_EMPTY_DATABASE:'true'}),'Sin migraciones pendientes');assert.ok(!queries.some(sql=>/CREATE|INSERT/.test(sql)));
});

test('errores Sequelize y Multer no filtran detalles internos',()=>{
  const handler=require('../src/middlewares/errorHandler');const s=require('sequelize');const MulterError=require('multer').MulterError;
  for(const [error,expected] of [[new s.ValidationError('secret'),400],[new s.UniqueConstraintError({message:'secret'}),409],[new s.ForeignKeyConstraintError({message:'secret'}),400],[new s.DatabaseError(new Error('secret')),500],[new MulterError('LIMIT_FILE_SIZE'),413]]) {
    let status,body;handler(error,{}, {status(code){status=code;return this},json(data){body=data}},()=>{});assert.equal(status,expected);assert.ok(!JSON.stringify(body).includes('secret'));
  }
});
test('IDs y paginación no aceptan arrays ni objetos',()=>{
  const v=require('../src/utils/validation');assert.throws(()=>v.id([1]));assert.throws(()=>v.pagination({limit:['20']}));assert.throws(()=>v.pedido({producto:'x',cantidad:1,total:1,usuarioId:[1]}));
});
