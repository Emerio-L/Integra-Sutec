const prisma = require('./prisma');

async function connectDB() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');
  await prisma.$connect();
  console.log('✅ Conectado a PostgreSQL');
}

module.exports = { connectDB };
