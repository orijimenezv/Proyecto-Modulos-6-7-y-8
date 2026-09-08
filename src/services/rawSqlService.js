const pool = require('../config/rawPool');

async function listarUsuariosSQL(nombre) {
  const values = [];
  let sql = 'SELECT id, nombre, email, "createdAt", "updatedAt" FROM usuarios';

  if (nombre) {
    values.push(`%${nombre}%`);
    sql += ' WHERE nombre ILIKE $1';
  }

  sql += ' ORDER BY id ASC';
  const result = await pool.query(sql, values);
  return result.rows;
}

module.exports = { listarUsuariosSQL };
