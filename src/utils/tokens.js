const jwt = require('jsonwebtoken');
const { createHmac } = require('crypto');
const { loadConfig } = require('../config/env');
function credentialVersion(hash) { return createHmac('sha256', loadConfig().jwt.secret).update(hash).digest('hex'); }
function sign(usuario) {
  const config = loadConfig().jwt;
  return jwt.sign({ id: usuario.id, cv: credentialVersion(usuario.passwordHash) }, config.secret, { algorithm: config.algorithm, expiresIn: config.expiresIn, issuer: config.issuer, audience: config.audience });
}
function verify(token) {
  const config = loadConfig().jwt;
  const payload = jwt.verify(token, config.secret, { algorithms: [config.algorithm], issuer: config.issuer, audience: config.audience });
  if (!Number.isInteger(payload.id) || payload.id < 1 || typeof payload.cv !== 'string' || !Number.isInteger(payload.exp)) throw new Error('Claims no válidos');
  return payload;
}
module.exports = { sign, verify, credentialVersion };
