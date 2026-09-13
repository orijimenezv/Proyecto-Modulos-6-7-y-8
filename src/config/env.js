const path = require('path');
if (process.env.NODE_ENV !== 'test') require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
function loadConfig(env = process.env) {
  const mode = env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(mode)) throw new Error('NODE_ENV no válido');
  function integer(key, fallback, min, max) {
    const value = Number(env[key] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(key + ' no válido');
    return value;
  }
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET) < 32 || /reemplazar|change_me|ficticio/i.test(env.JWT_SECRET)) throw new Error('Configura JWT_SECRET con al menos 32 bytes aleatorios; no uses el ejemplo');
  const origins = (env.CORS_ORIGINS || (mode === 'production' ? '' : 'http://localhost:5500,http://127.0.0.1:5500')).split(',').map(x => x.trim()).filter(Boolean);
  if (mode === 'production' && !origins.length) throw new Error('CORS_ORIGINS es obligatorio en producción');
  for (const origin of origins) {
    let url;
    try { url = new URL(origin); } catch { throw new Error('CORS_ORIGINS debe contener orígenes completos'); }
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol) || (mode === 'production' && url.protocol !== 'https:')) throw new Error('Origen CORS no válido');
  }
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl && (!env.DB_NAME || !env.DB_USER || !env.DB_PASSWORD)) throw new Error('Configura DATABASE_URL o DB_NAME, DB_USER y DB_PASSWORD');
  let ssl = env.DB_SSL === 'true';
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL)) throw new Error('DB_SSL debe ser true o false');
  let connection = { name: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD, host: env.DB_HOST || 'localhost', port: integer('DB_PORT', 5432, 1, 65535) };
  let connectionTimeoutMillis = 10000;
  if (databaseUrl) {
    let url;
    try { url = new URL(databaseUrl); } catch { throw new Error('DATABASE_URL no válida'); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL debe ser PostgreSQL');
    if (databaseUrl.includes('#')) throw new Error('DATABASE_URL no admite fragmentos');
    const allowed = new Set(['sslmode', 'channel_binding', 'connect_timeout']);
    const seen = new Set();
    for (const [key] of url.searchParams) {
      if (!allowed.has(key) || seen.has(key)) throw new Error('DATABASE_URL contiene parámetros no admitidos o repetidos');
      seen.add(key);
    }
    if (url.searchParams.has('sslmode')) {
      if (!['require', 'verify-full'].includes(url.searchParams.get('sslmode'))) throw new Error('sslmode debe ser require o verify-full');
      if (env.DB_SSL === 'false') throw new Error('DB_SSL=false contradice el TLS solicitado por DATABASE_URL');
      ssl = true;
    }
    // pg 8.23 admite PLUS opcional, pero Sequelize 6.37.8 no transmite enableChannelBinding.
    // No prometer la semántica obligatoria de libpq ni ignorar una política de seguridad.
    if (url.searchParams.has('channel_binding')) throw new Error('channel_binding no está soportado de forma estricta por la integración actual Sequelize/pg');
    if (url.searchParams.has('connect_timeout')) {
      const timeout = url.searchParams.get('connect_timeout');
      if (!/^[1-9]\d*$/.test(timeout) || Number(timeout) > 60) throw new Error('connect_timeout debe ser un entero entre 1 y 60 segundos');
      connectionTimeoutMillis = Number(timeout) * 1000;
    }
    try {
      connection = { name: decodeURIComponent(url.pathname.slice(1)), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), host: url.hostname.replace(/^\[|\]$/g, ''), port: url.port ? Number(url.port) : 5432 };
    } catch { throw new Error('DATABASE_URL contiene codificación no válida'); }
    if (!connection.name || !connection.user || !connection.password || !connection.host || !Number.isInteger(connection.port) || connection.port < 1 || connection.port > 65535 || Object.values(connection).some(value => typeof value === 'string' && /[\u0000-\u001f\u007f]/.test(value))) throw new Error('DATABASE_URL debe definir una conexión PostgreSQL completa y válida');
  }
  if (mode === 'production' && !ssl) throw new Error('Producción requiere DB_SSL=true o sslmode seguro en DATABASE_URL');
  const storageDriver = env.STORAGE_DRIVER || (mode === 'production' ? 'disabled' : 'local');
  if (!['local', 'disabled'].includes(storageDriver) || (mode === 'production' && storageDriver !== 'disabled')) throw new Error('El almacenamiento local no está permitido en producción');
  return Object.freeze({
    mode, port: integer('PORT', 3000, 1, 65535), origins,
    jwt: { secret: env.JWT_SECRET, expiresIn: integer('JWT_TTL_SECONDS', 3600, 60, 86400), algorithm: 'HS256', issuer: 'portafolio-backend', audience: 'portafolio-client' },
    // No guardar/pasar la URL original: Sequelize no debe reinterpretar sus parámetros.
    database: { ...connection, connectionTimeoutMillis, poolMax: integer('DB_POOL_MAX', 2, 1, 10), ssl: ssl ? { require: true, rejectUnauthorized: true, ...(env.DB_SSL_CA ? { ca: env.DB_SSL_CA.split(String.fromCharCode(92) + 'n').join(String.fromCharCode(10)) } : {}) } : false },
    storage: { driver: storageDriver, directory: path.resolve(__dirname, '../../.data/uploads'), maxBytes: 2 * 1024 * 1024 },
    loginLimit: integer('LOGIN_RATE_LIMIT', 10, 1, 100),
    registrationLimit: integer('REGISTRATION_RATE_LIMIT', 10, 1, 100),
  });
}
module.exports = { loadConfig };
