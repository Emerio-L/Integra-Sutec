require('dotenv').config({ path: '../../.env' });

const readline = require('node:readline');
const mongoose = require('mongoose');
const User = require('../src/modules/auth/user.model');

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      reject(new Error('Este comando debe ejecutarse en una terminal interactiva.'));
      return;
    }

    let value = '';
    process.stdout.write(prompt);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    function finish() {
      process.stdin.off('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    }

    function onKeypress(character, key) {
      if (key?.ctrl && key.name === 'c') {
        finish();
        reject(new Error('Operación cancelada.'));
        return;
      }

      if (key?.name === 'return' || key?.name === 'enter') {
        finish();
        resolve(value);
        return;
      }

      if (key?.name === 'backspace') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }

      if (character && !key?.ctrl && !key?.meta && character >= ' ') {
        value += character;
        process.stdout.write('*');
      }
    }

    process.stdin.on('keypress', onKeypress);
  });
}

async function resetPassword() {
  const email = process.argv.slice(2).find((argument) => argument !== '--')?.trim().toLowerCase();

  if (!email) {
    throw new Error('Uso: pnpm admin:reset-password -- correo@ejemplo.com');
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI no está configurada.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email, role: 'admin' }).select('+password_hash');
  if (!user) {
    throw new Error('No existe una cuenta administradora activa con ese correo.');
  }

  const password = await readHidden('Nueva contraseña: ');
  const confirmation = await readHidden('Confirma la contraseña: ');

  if (password.length < 12) {
    throw new Error('La contraseña debe tener al menos 12 caracteres.');
  }
  if (password !== confirmation) {
    throw new Error('Las contraseñas no coinciden.');
  }

  user.password_hash = password;
  user.status = 'active';
  await user.save();

  console.log(`Contraseña actualizada para ${email}.`);
}

resetPassword()
  .catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
