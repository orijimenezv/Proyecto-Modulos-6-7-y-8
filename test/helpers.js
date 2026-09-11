const bcrypt = require('bcryptjs');
const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const state = { users: [], orders: [], nextUser: 3, nextOrder: 3, fail: null, transactions: [], lastQuery: null };
const password = 'Demo-test-2026';
const hash = bcrypt.hashSync(password, 10);
function reset() {
  state.users = [{ id: 1, nombre: 'Ana Demo', email: 'ana@example.invalid', passwordHash: hash }, { id: 2, nombre: 'Beto Demo', email: 'beto@example.invalid', passwordHash: hash }];
  state.orders = [{ id: 1, usuarioId: 1, producto: 'Libro', cantidad: 1, total: '10.00', estado: 'pendiente' }, { id: 2, usuarioId: 2, producto: 'Otro', cantidad: 2, total: '20.00', estado: 'pagado' }];
  state.nextUser = 3; state.nextOrder = 3; state.fail = null; state.transactions = []; state.lastQuery = null;
}
function maybeFail(operation) { if (state.fail === operation) { state.fail = null; throw new Error('SIMULATED_DATABASE_SECRET'); } }
function record(row, kind, withHash = false) {
  if (!row) return null;
  const result = { ...row };
  if (!withHash) delete result.passwordHash;
  Object.defineProperties(result, {
    toJSON: { value() { const data = { ...this }; delete data.passwordHash; return data; } },
    update: { value: async function(changes) { maybeFail(kind + '.update'); Object.assign(row, changes); Object.assign(this, changes); return this; } },
    destroy: { value: async function() { maybeFail(kind + '.destroy'); state[kind] = state[kind].filter(x => x.id !== row.id); } },
  });
  return result;
}
function userModel(withHash = false) { return {
  async findByPk(id, options = {}) { maybeFail('users.read'); const result = record(state.users.find(x => x.id === Number(id)), 'users', withHash); if (result && options.include) result.pedidos = state.orders.filter(x => x.usuarioId === Number(id)); return result; },
  async findOne({ where }) { maybeFail('users.read'); return record(state.users.find(x => x.email === where.email), 'users', withHash); },
  async findAll({ where, limit, offset }) { return state.users.filter(x => x.id === where.id).filter(x => !where.nombre || x.nombre.toLowerCase().includes(String(Object.values(Object.getOwnPropertyDescriptors(where.nombre))[0].value).replaceAll('%', '').toLowerCase())).slice(offset, offset + limit).map(x => record(x, 'users')); },
  async create(data) { maybeFail('users.create'); if (state.users.some(x => x.email === data.email)) throw new UniqueConstraintError({ message: 'duplicate' }); const row = { ...data, id: state.nextUser++ }; state.users.push(row); return record(row, 'users', true); },
  async count() { return state.users.length; },
}; }
const Usuario = { ...userModel(), scope() { return userModel(true); }, unscoped() { return userModel(true); } };
const Pedido = {
  async findAll({ where, limit, offset }) { return state.orders.filter(x => x.usuarioId === where.usuarioId).slice(offset, offset + limit).map(x => record(x, 'orders')); },
  async findOne({ where }) { maybeFail('orders.read'); return record(state.orders.find(x => x.id === where.id && x.usuarioId === where.usuarioId), 'orders'); },
  async create(data) { maybeFail('orders.create'); if (!state.users.some(x => x.id === data.usuarioId)) throw new ForeignKeyConstraintError(); const row = { ...data, id: state.nextOrder++, estado: data.estado || 'pendiente' }; state.orders.push(row); return record(row, 'orders'); },
  async destroy({ where }) { maybeFail('orders.destroy'); state.orders = state.orders.filter(x => x.usuarioId !== where.usuarioId); },
  async count() { return state.orders.length; },
};
const sequelize = {
  async transaction(callback) {
    const snapshot = structuredClone({ users: state.users, orders: state.orders });
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    try { const result = await callback(transaction); state.transactions.push('commit'); return result; }
    catch (error) { Object.assign(state, snapshot); state.transactions.push('rollback'); throw error; }
  },
  async query(sql, options) { maybeFail('query'); state.lastQuery = { sql, options }; return state.users.filter(x => x.id === options.bind.owner).map(({ passwordHash, ...x }) => x); },
};
reset();
module.exports = { models: { Usuario, Pedido, sequelize }, state, reset, password };
