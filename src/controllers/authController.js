const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email y contraseña son obligatorios',
        data: null
      });
    }

    const usuario = await Usuario.scope('conPassword').findOne({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales incorrectas',
        data: null
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.passwordHash
    );

    if (!passwordValida) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciales incorrectas',
        data: null
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    res.json({
      status: 'success',
      message: 'Login correcto',
      data: {
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login
};