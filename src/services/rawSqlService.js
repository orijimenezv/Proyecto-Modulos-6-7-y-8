const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');
const v = require('../utils/validation');
async function listarUsuariosSQL(query, actorId) {
  const { nombre, limit, offset } = v.pagination(query);
  const bind = { owner: v.id(actorId), limit, offset };
  let sql = 'SELECT id, nombre, email, "createdAt", "updatedAt" FROM usuarios WHERE id = $owner';
  if (nombre) { sql += ' AND nombre ILIKE $nombre'; bind.nombre = '%' + nombre + '%'; }
  sql += ' ORDER BY id ASC LIMIT $limit OFFSET $offset';
  return sequelize.query(sql, { bind, type: QueryTypes.SELECT });
}
module.exports = { listarUsuariosSQL };
