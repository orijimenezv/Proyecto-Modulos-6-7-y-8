const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const { loadConfig } = require('../config/env');
const AppError = require('../utils/AppError');
const { id } = require('../utils/validation');
function assertAvailable() {
  if (loadConfig().storage.driver !== 'local') throw new AppError('Almacenamiento no disponible; integración de objetos pendiente', 503);
}
function imageExtension(file) {
  const b = file.buffer;
  const png = b.length >= 45 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && b.readUInt32BE(8) === 13 && b.toString('ascii', 12, 16) === 'IHDR' && b.readUInt32BE(16) > 0 && b.readUInt32BE(20) > 0 && b.subarray(-12).equals(Buffer.from([0,0,0,0,73,69,78,68,174,66,96,130]));
  const jpeg = b.length >= 4 && b[0] === 255 && b[1] === 216 && b[2] === 255 && b[b.length - 2] === 255 && b[b.length - 1] === 217;
  if (png && file.mimetype === 'image/png') return '.png';
  if (jpeg && file.mimetype === 'image/jpeg') return '.jpg';
  throw new AppError('El contenido no corresponde a una imagen permitida', 400);
}
async function save(file, ownerId) {
  assertAvailable();
  if (!file) throw new AppError('No se recibió ningún archivo', 400);
  if (file.buffer.length > loadConfig().storage.maxBytes) throw new AppError('El archivo supera el máximo de 2 MiB', 413);
  const name = randomUUID() + imageExtension(file);
  const directory = path.join(loadConfig().storage.directory, String(id(ownerId)));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, name), file.buffer, { flag: 'wx', mode: 0o600 });
  return { nombre: name, ruta: '/api/archivos/' + name };
}
async function read(name, ownerId) {
  assertAvailable();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg)$/.test(name)) throw new AppError('Archivo no encontrado', 404);
  try { return await fs.readFile(path.join(loadConfig().storage.directory, String(id(ownerId)), name)); }
  catch (error) { if (error.code === 'ENOENT') throw new AppError('Archivo no encontrado', 404); throw error; }
}
// Contrato save/read: sustituir por un adaptador de objetos al incorporar proveedor.
module.exports = { assertAvailable, save, read, imageExtension };
