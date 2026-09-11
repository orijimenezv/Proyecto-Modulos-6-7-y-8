const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
// No se lee .env. Cualquier conexión PostgreSQL accidental falla antes de abrir sockets.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.DB_NAME = 'unused_test'; process.env.DB_USER = 'synthetic'; process.env.DB_PASSWORD = 'synthetic';
delete process.env.DATABASE_URL;
process.env.CORS_ORIGINS = 'http://localhost:5500,https://demo.github.io';
process.env.STORAGE_DRIVER = 'local'; process.env.LOGIN_RATE_LIMIT = '100';
process.env.REGISTRATION_RATE_LIMIT = '100';
require('pg').Client.prototype.connect = function() { throw new Error('REAL_DATABASE_ACCESS_FORBIDDEN'); };
const helper = require('./helpers');
const modelPath = require.resolve('../src/models');
require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: helper.models };
const env = require('../src/config/env');
const loadConfig = env.loadConfig;
let directory;
env.loadConfig = () => { const c = loadConfig(); return { ...c, storage: { ...c.storage, directory } }; };
const app = require('../src/app');
const tokens = require('../src/utils/tokens');
const jwt = require('jsonwebtoken');
let server, base;
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'portafolio-test-'));
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (directory && path.dirname(path.resolve(directory)) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith('portafolio-test-')) await fs.rm(directory, { recursive: true, force: true });
});
beforeEach(() => helper.reset());
function token(id = 1) { return tokens.sign(helper.state.users.find(x => x.id === id)); }
async function request(route, { method = 'GET', body, auth, headers = {} } = {}) {
  const response = await fetch(base + route, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: 'Bearer ' + auth } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
}
const newUser = { nombre: 'Nueva Cuenta', email: 'nueva@example.invalid', password: 'Nueva-demo-2026' };
const newOrder = { producto: 'Teclado', cantidad: 1, total: '12.50' };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=', 'base64');
async function upload(buffer, name, type, auth = token()) {
  const body = new FormData(); body.append('archivo', new Blob([buffer], { type }), name);
  const response = await fetch(base + '/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + auth }, body });
  return { status: response.status, data: await response.json() };
}
test('login correcto emite JWT sin hash ni contraseña', async () => {
  const r = await request('/login', { method: 'POST', body: { email: 'ana@example.invalid', password: helper.password } });
  assert.equal(r.status, 200); assert.equal(tokens.verify(r.data.data.token).id, 1); assert.ok(!JSON.stringify(r.data).includes(helper.password));
});
test('login incorrecto y cuenta ausente usan el mismo 401', async () => {
  for (const email of ['ana@example.invalid', 'ausente@example.invalid']) {
    const r = await request('/login', { method: 'POST', body: { email, password: 'incorrecta' } }); assert.equal(r.status, 401); assert.equal(r.data.message, 'Credenciales incorrectas');
  }
});
test('rutas privadas sin token responden 401', async () => {
  for (const [route, method] of [['/api/usuarios','GET'],['/api/usuarios/sql','GET'],['/api/usuarios/1','PUT'],['/api/usuarios/1','DELETE'],['/api/pedidos','GET'],['/api/pedidos','POST'],['/api/pedidos/1','PUT'],['/api/pedidos/1','DELETE'],['/upload','POST'],['/api/archivos/test.png','GET']]) assert.equal((await request(route,{method})).status,401);
});
test('token inválido, expirado, algoritmo e issuer incorrectos responden 401', async () => {
  const config = loadConfig().jwt;
  const payload = { id: 1, cv: tokens.credentialVersion(helper.state.users[0].passwordHash) };
  const invalid = ['invalid', jwt.sign(payload, config.secret, { expiresIn: -1, issuer: config.issuer, audience: config.audience }), jwt.sign(payload, config.secret, { algorithm: 'HS384', expiresIn: 60, issuer: config.issuer, audience: config.audience }), jwt.sign(payload, config.secret, { expiresIn: 60, issuer: 'wrong', audience: config.audience })];
  for (const auth of invalid) assert.equal((await request('/api/pedidos', { auth })).status, 401);
});
test('usuario no puede leer, modificar contraseña o eliminar otra cuenta', async () => {
  for (const method of ['GET','PUT','DELETE']) assert.equal((await request('/api/usuarios/2', { method, auth: token(), ...(method === 'PUT' ? {body: {password: 'Ataque-test-2026'}} : {}) })).status,403);
  assert.equal(helper.state.users.length,2); assert.equal((await request('/api/usuarios/2/detalles',{auth:token()})).status,403);
});
test('lecturas ORM y SQL solo exponen la cuenta propia, sin hashes', async () => {
  for (const route of ['/api/usuarios','/api/usuarios/sql']) { const r=await request(route,{auth:token()}); assert.equal(r.status,200); assert.deepEqual(r.data.data.map(x=>x.id),[1]); assert.ok(!JSON.stringify(r.data).includes('passwordHash')); }
});
test('SQL manual usa bind y no interpola filtro recibido', async () => {
  const input="x' OR 1=1 --";
  assert.equal((await request('/api/usuarios/sql?nombre='+encodeURIComponent(input),{auth:token()})).status,200);
  assert.equal(helper.state.lastQuery.options.bind.owner,1); assert.ok(!helper.state.lastQuery.sql.includes(input)); assert.equal(helper.state.lastQuery.options.bind.nombre,'%'+input+'%');
});
test('CRUD de usuario propio y revocación tras cambio de contraseña', async () => {
  const created=await request('/api/usuarios',{method:'POST',body:newUser}); assert.equal(created.status,201); assert.ok(!('passwordHash' in created.data.data));
  const id=created.data.data.id; let auth=token(id);
  assert.equal((await request('/api/usuarios/'+id,{auth})).status,200);
  assert.equal((await request('/api/usuarios/'+id,{method:'PUT',auth,body:{password:'Nueva-clave-2026'}})).status,200);
  assert.equal((await request('/api/usuarios/'+id,{auth})).status,401);
  auth=token(id); assert.equal((await request('/api/usuarios/'+id,{method:'DELETE',auth})).status,200);
  assert.equal((await request('/api/pedidos',{auth})).status,401);
});
test('duplicado de email produce 409', async () => assert.equal((await request('/api/usuarios',{method:'POST',body:{...newUser,email:'ana@example.invalid'}})).status,409));
test('validación de registros rechaza tipos, campos y password inválidos', async () => {
  for(const body of [{...newUser,password:42},{...newUser,password:'corta'},{...newUser,password:'á'.repeat(40)},{...newUser,email:'incorrecto'},{...newUser,nombre:' '},{...newUser,role:'admin'},[]]) assert.equal((await request('/api/usuarios',{method:'POST',body})).status,400);
});
test('validación de ID, body vacío, paginación y JSON mal formado', async () => {
  assert.equal((await request('/api/usuarios/abc',{auth:token()})).status,400);
  assert.equal((await request('/api/pedidos/abc',{auth:token()})).status,400);
  assert.equal((await request('/api/usuarios/1',{method:'PUT',auth:token(),body:{}})).status,400);
  assert.equal((await request('/api/pedidos?limit=1000',{auth:token()})).status,400);
  const response=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'}); assert.equal(response.status,400);
});
test('CRUD de pedidos con propietario derivado del token', async () => {
  const auth=token(); const created=await request('/api/pedidos',{method:'POST',auth,body:newOrder}); assert.equal(created.status,201); assert.equal(created.data.data.usuarioId,1);
  const id=created.data.data.id;
  assert.equal((await request('/api/pedidos/'+id,{auth})).status,200);
  const updated=await request('/api/pedidos/'+id,{method:'PUT',auth,body:{estado:'cancelado'}}); assert.equal(updated.status,200); assert.equal(updated.data.data.estado,'cancelado');
  assert.equal((await request('/api/pedidos/'+id,{method:'DELETE',auth})).status,200);
  assert.equal((await request('/api/pedidos/'+id,{auth})).status,404);
});
test('pedidos ajenos no se listan ni se leen/modifican/eliminan', async () => {
  const auth=token(); const list=await request('/api/pedidos',{auth}); assert.deepEqual(list.data.data.map(x=>x.id),[1]);
  for(const method of ['GET','PUT','DELETE']) assert.equal((await request('/api/pedidos/2',{method,auth,...(method==='PUT'?{body:{estado:'cancelado'}}:{})})).status,404);
  assert.equal((await request('/api/pedidos',{method:'POST',auth,body:{...newOrder,usuarioId:2}})).status,403);
  assert.equal((await request('/api/pedidos/1',{method:'PUT',auth,body:{producto:'Test',usuarioId:2}})).status,403);
});
test('validación de pedidos rechaza tipos, importes, estados y campos', async () => {
  for(const body of [{...newOrder,cantidad:0},{...newOrder,cantidad:1.2},{...newOrder,total:-1},{...newOrder,total:'1.234'},{...newOrder,estado:'inventado'},{...newOrder,producto:[]},{...newOrder,id:77}]) assert.equal((await request('/api/pedidos',{method:'POST',auth:token(),body})).status,400);
});
test('transacción crea cuenta y pedido propios con commit', async () => {
  const result=await request('/api/usuarios/transaccion',{method:'POST',body:{usuario:newUser,pedido:newOrder}}); assert.equal(result.status,201); assert.equal(result.data.data.usuario.id,result.data.data.pedido.usuarioId); assert.deepEqual(helper.state.transactions,['commit']);
});
test('transacción revierte ambas inserciones ante error simulado', async () => {
  helper.state.fail='orders.create'; const result=await request('/api/usuarios/transaccion',{method:'POST',body:{usuario:newUser,pedido:newOrder}}); assert.equal(result.status,500); assert.equal(helper.state.users.length,2); assert.equal(helper.state.orders.length,2); assert.deepEqual(helper.state.transactions,['rollback']); assert.ok(!JSON.stringify(result).includes('SIMULATED_DATABASE_SECRET'));
});
test('transacción rechaza forzarError y dueño ajeno', async () => {
  for(const body of [{usuario:newUser,pedido:newOrder,forzarError:true},{usuario:newUser,pedido:{...newOrder,usuarioId:2}},{usuario:{...newUser,password:'x'},pedido:newOrder}]) assert.equal((await request('/api/usuarios/transaccion',{method:'POST',body})).status,400);
});
test('eliminación de usuario y pedidos es atómica ante error simulado', async () => {
  helper.state.fail='users.destroy'; const result=await request('/api/usuarios/1',{method:'DELETE',auth:token()}); assert.equal(result.status,500); assert.equal(helper.state.users.length,2); assert.equal(helper.state.orders.length,2); assert.deepEqual(helper.state.transactions,['rollback']);
});
test('fallo de BD durante autenticación devuelve 500 genérico, no 401', async () => {
  const auth=token(); helper.state.fail='users.read'; const r=await request('/api/pedidos',{auth}); assert.equal(r.status,500); assert.equal(r.data.message,'Error interno del servidor');
});
test('CORS permite origen exacto, preflight y errores con cabeceras', async () => {
  const headers={Origin:'https://demo.github.io'};
  const pre=await request('/api/pedidos/1',{method:'OPTIONS',headers:{...headers,'Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(pre.status,204); assert.equal(pre.headers.get('access-control-allow-origin'),headers.Origin); assert.equal(pre.headers.get('access-control-allow-headers'),'Content-Type,Authorization');
  const err=await request('/api/pedidos',{headers}); assert.equal(err.status,401); assert.equal(err.headers.get('access-control-allow-origin'),headers.Origin);
  assert.equal((await request('/health',{headers:{Origin:'https://evil.example'}})).status,403);
});
test('subida válida usa UUID y lectura privada por propietario', async () => {
  const r=await upload(png,'original.png','image/png'); assert.equal(r.status,201); assert.match(r.data.data.nombre,/^[0-9a-f-]+\.png$/); assert.ok(!r.data.data.nombre.includes('original'));
  const response=await fetch(base+r.data.data.ruta,{headers:{Authorization:'Bearer '+token()}}); assert.equal(response.status,200); assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);
  assert.equal((await request(r.data.data.ruta,{auth:token(2)})).status,404);
  assert.equal((await request('/public/uploads/'+r.data.data.nombre)).status,404);
});
test('subida rechaza extensión, MIME y contenido falso', async () => {
  for(const [b,name,type] of [[png,'archivo.txt','text/plain'],[png,'archivo.png','text/plain'],[Buffer.from('not an image'),'archivo.png','image/png']]) assert.equal((await upload(b,name,type)).status,400);
});
test('subida rechaza exceso de tamaño con 413 y archivo ausente con 400', async () => {
  assert.equal((await upload(Buffer.alloc(2*1024*1024+1),'grande.png','image/png')).status,413);
  assert.equal((await request('/upload',{method:'POST',auth:token()})).status,400);
});
test('almacenamiento deshabilitado responde 503 sin guardar', async () => {
  process.env.STORAGE_DRIVER='disabled';
  try { assert.equal((await upload(png,'test.png','image/png')).status,503); }
  finally { process.env.STORAGE_DRIVER='local'; }
});
test('ruta inexistente responde 404 y usa cabeceras de seguridad',async()=>{const r=await request('/no-existe');assert.equal(r.status,404);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('x-powered-by'),null)});

test('borrado propio elimina sus pedidos y conserva los ajenos',async()=>{
  const r=await request('/api/usuarios/1',{method:'DELETE',auth:token()});assert.equal(r.status,200);assert.deepEqual(helper.state.users.map(x=>x.id),[2]);assert.deepEqual(helper.state.orders.map(x=>x.id),[2]);assert.deepEqual(helper.state.transactions,['commit']);
});
test('preflight no necesita token y formulario no acepta campos extras',async()=>{
  const body=new FormData();body.append('usuarioId','2');body.append('archivo',new Blob([png],{type:'image/png'}),'test.png');
  const r=await fetch(base+'/upload',{method:'POST',headers:{Authorization:'Bearer '+token()},body});assert.equal(r.status,400);
});
test('limitador de login está conectado a la ruta',async()=>{
  let response;
  // Entradas inválidas evitan el coste de bcrypt pero cuentan como intentos.
  for(let i=0;i<101;i++) response=await request('/login',{method:'POST',body:{email:'invalid',password:'x'}});
  assert.equal(response.status,429);assert.ok(response.headers.get('retry-after'));
});
test('harness no importa la conexión real de base de datos',()=>assert.equal(require.cache[require.resolve('../src/config/database')],undefined));
