const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}
const files = ['index.js', ...['src', 'scripts', 'test'].flatMap(walk)].filter(file => file.endsWith('.js'));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(1);
}
console.log('Sintaxis correcta en ' + files.length + ' archivos JavaScript');
