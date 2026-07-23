const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

function findJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? findJavaScriptFiles(path)
      : entry.isFile() && entry.name.endsWith('.js')
        ? [path]
        : [];
  });
}

const files = findJavaScriptFiles(join(__dirname, '..', 'src'));

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Sintaxis validada en ${files.length} archivos JavaScript de la API.`);
