const { Sequelize } = require('sequelize');
const { loadConfig } = require('./env');
const { database: db } = loadConfig();
const options = { dialect: 'postgres', host: db.host, port: db.port, logging: false,
  pool: { max: db.poolMax, min: 0, acquire: db.connectionTimeoutMillis + 5000, idle: 10000 },
  dialectOptions: { ssl: db.ssl, connectionTimeoutMillis: db.connectionTimeoutMillis, statement_timeout: 10000 } };
// Pasar campos, nunca URI: evita que pg-connection-string reemplace dialectOptions.ssl.
module.exports = new Sequelize(db.name, db.user, db.password, options);
