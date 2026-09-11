const { Sequelize } = require('sequelize');
const { loadConfig } = require('./env');
const { database: db } = loadConfig();
const options = { dialect: 'postgres', host: db.host, port: db.port, logging: false,
  pool: { max: db.poolMax, min: 0, acquire: 10000, idle: 10000 },
  dialectOptions: { ssl: db.ssl, connectionTimeoutMillis: 10000, statement_timeout: 10000 } };
module.exports = db.url ? new Sequelize(db.url, options) : new Sequelize(db.name, db.user, db.password, options);
