const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const validation = require('../utils/validation');
const tokens = require('../utils/tokens');
const AppError = require('../utils/AppError');
// Comparación sintética para mantener el coste incluso cuando no existe la cuenta.
const dummyHash = bcrypt.hashSync(require('crypto').randomBytes(32).toString('hex'), 10);
async function login(req, res, next) {
  try {
    validation.keys(req.body, ['email', 'password']);
    const email = validation.email(req.body.email);
    const password = validation.password(req.body.password, true);
    const usuario = await Usuario.scope('conPassword').findOne({ where: { email } });
    const valid = await bcrypt.compare(password, usuario ? usuario.passwordHash : dummyHash);
    if (!usuario || !valid) throw new AppError('Credenciales incorrectas', 401);
    res.json({ status: 'success', message: 'Login correcto', data: { token: tokens.sign(usuario) } });
  } catch (error) { next(error); }
}
module.exports = { login };
