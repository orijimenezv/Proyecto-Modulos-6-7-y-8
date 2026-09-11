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
  const ssl = env.DB_SSL === 'true';
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL)) throw new Error('DB_SSL debe ser true o false');
  if (databaseUrl) {
    let url;
    try { url = new URL(databaseUrl); } catch { throw new Error('DATABASE_URL no válida'); }
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL debe ser PostgreSQL');
    if (url.search || url.hash) throw new Error('DATABASE_URL no admite parámetros: configura TLS y opciones mediante las variables documentadas');
  }
  if (mode === 'production' && !ssl) throw new Error('DB_SSL=true es obligatorio en producción');
  const storageDriver = env.STORAGE_DRIVER || (mode === 'production' ? 'disabled' : 'local');
  if (!['local', 'disabled'].includes(storageDriver) || (mode === 'production' && storageDriver !== 'disabled')) throw new Error('El almacenamiento local no está permitido en producción');
  return Object.freeze({
    mode, port: integer('PORT', 3000, 1, 65535), origins,
    jwt: { secret: env.JWT_SECRET, expiresIn: integer('JWT_TTL_SECONDS', 3600, 60, 86400), algorithm: 'HS256', issuer: 'portafolio-backend', audience: 'portafolio-client' },
    database: { url: databaseUrl, name: env.DB_NAME, user: env.DB_USER, password: env.DB_PASSWORD, host: env.DB_HOST || 'localhost', port: integer('DB_PORT', 5432, 1, 65535), poolMax: integer('DB_POOL_MAX', 2, 1, 10), ssl: ssl ? { require: true, rejectUnauthorized: true, ...(env.DB_SSL_CA ? { ca: env.DB_SSL_CA.split(String.fromCharCode(92) + 'n').join(String.fromCharCode(10)) } : {}) } : false },
    storage: { driver: storageDriver, directory: path.resolve(__dirname, '../../.data/uploads'), maxBytes: 2 * 1024 * 1024 },
    loginLimit: integer('LOGIN_RATE_LIMIT', 10, 1, 100),
    registrationLimit: integer('REGISTRATION_RATE_LIMIT', 10, 1, 100),
  });
}
module.exports = { loadConfig };
