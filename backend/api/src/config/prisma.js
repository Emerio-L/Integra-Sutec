const { PrismaClient } = require('@prisma/client');

const prisma = global.__integraPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__integraPrisma = prisma;

module.exports = prisma;
