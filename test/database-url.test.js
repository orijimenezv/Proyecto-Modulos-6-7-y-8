const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
const { loadConfig } = require('../src/config/env');
const base = { NODE_ENV: 'test', JWT_SECRET: 'synthetic-test-key-only-01234567890123456789' };
const url = 'postgresql://demo_user:demo_password@db.example.invalid:5432/demo_db';

test('URL estilo Neon activa TLS verificado y traduce connect_timeout', () => {
  const db = loadConfig({ ...base, DATABASE_URL: url + '?sslmode=require&connect_timeout=15' }).database;
  assert.equal(db.ssl.rejectUnauthorized, true);
  assert.equal(db.connectionTimeoutMillis, 15000);
  assert.equal(db.host, 'db.example.invalid');
  assert.equal(db.name, 'demo_db');
  assert.equal(db.url, undefined);
});

test('producción acepta require y verify-full sin debilitar certificado ni hostname', () => {
  for (const sslmode of ['require', 'verify-full']) {
    const db = loadConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://frontend.example.invalid', DATABASE_URL: url + '?sslmode=' + sslmode }).database;
    assert.equal(db.ssl.rejectUnauthorized, true);
    assert.equal(db.ssl.checkServerIdentity, undefined);
  }
});

test('rechaza overrides TLS, parámetros desconocidos, duplicados y contradicciones', () => {
  for (const query of ['sslmode=disable', 'sslmode=allow', 'sslmode=prefer', 'sslmode=no-verify', 'sslmode=verify-ca', 'ssl=false', 'uselibpqcompat=true', 'sslrootcert=demo', 'sslmode=require&sslmode=disable', 'options=demo']) {
    assert.throws(() => loadConfig({ ...base, DB_SSL: 'true', DATABASE_URL: url + '?' + query }));
  }
  assert.throws(() => loadConfig({ ...base, DB_SSL: 'false', DATABASE_URL: url + '?sslmode=require' }), /contradice/);
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://frontend.example.invalid', DATABASE_URL: url }), /Producción requiere/);
});

test('channel binding obligatorio se rechaza explícitamente en esta integración', () => {
  assert.throws(() => loadConfig({ ...base, DATABASE_URL: url + '?sslmode=require&channel_binding=require' }), /channel_binding no está soportado de forma estricta/);
});

test('rechaza protocolos ajenos, fragmentos incluso vacíos y conexiones incompletas', () => {
  for (const value of [url.replace('postgresql:', 'https:'), url + '#demo', url + '#', 'postgresql://db.example.invalid/demo', url.replace('demo_password', '%ZZ')]) {
    assert.throws(() => loadConfig({ ...base, DATABASE_URL: value }));
  }
});

test('connect_timeout está acotado a segundos enteros entre 1 y 60', () => {
  for (const value of ['0', '-1', '61', '1.5', '', 'Infinity']) assert.throws(() => loadConfig({ ...base, DATABASE_URL: url + '?connect_timeout=' + value }));
  for (const value of [1, 60]) assert.equal(loadConfig({ ...base, DATABASE_URL: url + '?connect_timeout=' + value }).database.connectionTimeoutMillis, value * 1000);
});

test('errores de URL no incluyen URL, usuario, contraseña, host ni JWT', () => {
  for (const value of [url + '#private', url + '?unknown=private', url + '?sslmode=disable', url + '?channel_binding=require', url + '?connect_timeout=secret', url.replace('postgresql:', 'https:')]) {
    assert.throws(() => loadConfig({ ...base, DATABASE_URL: value }), error => {
      for (const secret of [value, 'demo_user', 'demo_password', 'db.example.invalid', base.JWT_SECRET]) assert.equal(error.message.includes(secret), false);
      return true;
    });
  }
});

test('mantiene DB_* local y decodifica credenciales ficticias sin perder caracteres', () => {
  const local = loadConfig({ ...base, DB_HOST: 'localhost', DB_PORT: '5433', DB_NAME: 'demo', DB_USER: 'demo', DB_PASSWORD: 'demo' }).database;
  assert.equal(local.port, 5433);
  assert.equal(local.ssl, false);
  const db = loadConfig({ ...base, DATABASE_URL: url.replace('postgresql:', 'postgres:').replace('demo_password', 'demo%3Apass%23word') }).database;
  assert.equal(db.password, 'demo:pass#word');
});

test('Sequelize y pg conservan TLS explícito sin recibir connectionString ni conectar', () => {
  const envModule = require('../src/config/env');
  const original = envModule.loadConfig;
  const databasePath = require.resolve('../src/config/database');
  envModule.loadConfig = () => loadConfig({ ...base, DATABASE_URL: url + '?sslmode=require&connect_timeout=12', DB_SSL_CA: 'synthetic-ca' });
  delete require.cache[databasePath];
  try {
    const sequelize = require(databasePath);
    assert.equal(sequelize.options.dialectModule, require('pg'));
    assert.equal(sequelize.connectionManager.lib, require('pg'));
    const options = sequelize.options.dialectOptions;
    const client = new (require('pg').Client)({ host: sequelize.config.host, ...options });
    assert.equal(sequelize.config.database, 'demo_db');
    assert.equal(client.connectionParameters.ssl.rejectUnauthorized, true);
    assert.equal(client.connectionParameters.ssl.ca, 'synthetic-ca');
    assert.equal(client.connectionParameters.ssl.checkServerIdentity, undefined);
    assert.equal(options.connectionTimeoutMillis, 12000);
    assert.equal(options.connectionString, undefined);
  } finally {
    envModule.loadConfig = original;
    delete require.cache[databasePath];
  }
});
