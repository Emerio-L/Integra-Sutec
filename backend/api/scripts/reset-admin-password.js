require('dotenv').config({ path: '../../.env' });
const readline = require('node:readline');
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) return reject(new Error('Este comando debe ejecutarse en una terminal interactiva.'));
    let value = '';
    process.stdout.write(prompt);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = () => { process.stdin.off('keypress', onKeypress); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
    function onKeypress(character, key) {
      if (key?.ctrl && key.name === 'c') { finish(); return reject(new Error('Operación cancelada.')); }
      if (key?.name === 'return' || key?.name === 'enter') { finish(); return resolve(value); }
      if (key?.name === 'backspace') { if (value.length) { value = value.slice(0,-1); process.stdout.write('\b \b'); } return; }
      if (character && !key?.ctrl && !key?.meta && character >= ' ') { value += character; process.stdout.write('*'); }
    }
    process.stdin.on('keypress', onKeypress);
  });
}

async function resetPassword() {
  const email = process.argv.slice(2).find(argument => argument !== '--')?.trim().toLowerCase();
  if (!email) throw new Error('Uso: pnpm admin:reset-password -- correo@ejemplo.com');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');
  const user = await prisma.user.findFirst({ where: { email, role: 'admin' } });
  if (!user) throw new Error('No existe una cuenta administradora con ese correo.');
  const password = await readHidden('Nueva contraseña: ');
  const confirmation = await readHidden('Confirma la contraseña: ');
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.');
  if (password !== confirmation) throw new Error('Las contraseñas no coinciden.');
  await prisma.user.update({ where: { id: user.id }, data: { password_hash: await bcrypt.hash(password,12), status:'active' } });
  console.log(`Contraseña actualizada para ${email}.`);
}
resetPassword().catch(error => { console.error(`Error: ${error.message}`); process.exitCode=1; }).finally(() => prisma.$disconnect());
