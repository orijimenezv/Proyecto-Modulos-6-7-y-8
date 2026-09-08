const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 80],
      },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
    scopes: {
      conPassword: { attributes: { include: ['passwordHash'] } },
    },
  }
);

module.exports = Usuario;
