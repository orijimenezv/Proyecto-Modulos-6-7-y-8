const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function harness(fetch) {
  const storage = new Map();
  const events = [];
  const window = { dispatchEvent(event) { events.push(event.type); } };
  const context = vm.createContext({ window, fetch, AbortController, Event, TextEncoder, setTimeout, clearTimeout, sessionStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) } });
  for (const file of ['config', 'api', 'auth', 'pedidos']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../frontend/js', file + '.js'), 'utf8'), context);
  return { app: window.Orbita, storage, events };
}
test('frontend envía Bearer desde sessionStorage y omite cookies; login no envía Bearer', async () => {
  const calls = [];
  const { app } = harness(async (url, options) => { calls.push({ url, options }); return { ok: true, status: 200, json: async () => ({ data: { token: 'synthetic-token-only' } }) }; });
  await app.auth.login(' demo@example.invalid ', 'synthetic-only');
  await app.pedidos.list(2);
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[1].options.headers.Authorization, 'Bearer synthetic-token-only');
  assert.equal(calls[1].options.credentials, 'omit');
  assert.match(calls[1].url, /limit=12&offset=24$/);
});
test('frontend 401 borra sesión y emite cierre incluso con respuesta no JSON', async () => {
  const { app, events } = harness(async () => ({ status: 401, ok: false }));
  app.session.set('synthetic-only');
  await assert.rejects(app.pedidos.list(0), /sesión terminó/);
  assert.equal(app.session.get(), null);
  assert.deepEqual(events, ['session-expired']);
});
test('frontend no reproduce contenido interno de errores API', async () => {
  const { app } = harness(async () => ({ status: 500, ok: false, json: async () => ({ message: 'synthetic-private-internal-detail' }) }));
  await assert.rejects(app.pedidos.list(0), error => !error.message.includes('synthetic-private') && /servicio/.test(error.message));
});
test('frontend valida importe, cantidad, producto y estado antes de guardar', () => {
  const { app } = harness(() => { throw new Error('No debe conectar'); });
  const valid = { producto: ' Demo ', cantidad: '2', total: '15.50', estado: 'pendiente' };
  assert.equal(app.pedidos.validate(valid).producto, 'Demo');
  for (const extra of [{ cantidad: '1.5' }, { cantidad: '0' }, { cantidad: '2147483648' }, { total: '-1' }, { total: '1.001' }, { total: '1e2' }, { producto: ' ' }, { estado: 'otro' }]) assert.throws(() => app.pedidos.validate({ ...valid, ...extra }));
});
test('frontend CRUD utiliza métodos y rutas esperados, sin asignar propietario', async () => {
  const calls = [];
  const { app } = harness(async (url, options) => { calls.push({ url, options }); return { status: 200, ok: true, json: async () => ({ data: {} }) }; });
  const body = app.pedidos.validate({ producto: 'Demo', cantidad: '1', total: '0', estado: 'pagado' });
  await app.pedidos.save(null, body); await app.pedidos.save(4, body); await app.pedidos.remove(4);
  assert.deepEqual(calls.map(call => call.options.method), ['POST', 'PUT', 'DELETE']);
  assert.ok(calls[1].url.endsWith('/api/pedidos/4'));
  assert.equal(JSON.parse(calls[0].options.body).usuarioId, undefined);
});
test('frontend registro limita bytes UTF-8 sin hacer petición inválida', () => {
  const { app } = harness(() => { throw new Error('No debe conectar'); });
  assert.throws(() => app.auth.register('Demo', 'demo@example.invalid', '😀'.repeat(19)), /72 bytes/);
});
