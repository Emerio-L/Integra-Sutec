require('dotenv').config({ path: '../../.env' });
const bcrypt = require('bcryptjs');
const prisma = require('./config/prisma');

const categories = [
  ['Niños','Tecnología, aprendizaje y entretenimiento para los más pequeños','kids'],
  ['Deportes','Equipamiento y tecnología para una vida activa','sports'],
  ['Familia','Soluciones para compartir, cuidar y disfrutar en familia','family'],
  ['Transporte','Movilidad, accesorios y tecnología para cada trayecto','transport'],
  ['Empresas','Equipos y soluciones para impulsar tu negocio','business'],
  ['Mascotas','Productos para el cuidado y bienestar de tus mascotas','pets'],
  ['Hogar','Tecnología y soluciones prácticas para cada espacio','home'],
  ['Seguridad','Protección, monitoreo y respaldo para tu tranquilidad','security'],
];

const slug = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');
  const [vehicles, transport] = await Promise.all([
    prisma.category.findUnique({ where: { name: 'Vehículos' } }),
    prisma.category.findUnique({ where: { name: 'Transporte' } }),
  ]);
  if (vehicles && !transport) {
    await prisma.category.update({
      where: { id: vehicles.id },
      data: { name: 'Transporte', slug: 'transporte', description: 'Movilidad, accesorios y tecnología para cada trayecto', icon: 'transport', status: 'active' },
    });
  } else if (vehicles && transport) {
    await prisma.$transaction([
      prisma.product.updateMany({ where: { category_id: vehicles.id }, data: { category_id: transport.id } }),
      prisma.category.delete({ where: { id: vehicles.id } }),
    ]);
  }
  const activeNames = categories.map(([name]) => name);
  const legacyCategories = await prisma.category.findMany({
    where: { name: { notIn: activeNames } },
    select: { id: true },
  });
  const legacyIds = legacyCategories.map(category => category.id);
  if (legacyIds.length) {
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { category_id: { in: legacyIds } },
        data: { category_id: null },
      }),
      prisma.category.deleteMany({
        where: { id: { in: legacyIds } },
      }),
    ]);
  }
  for (const [name,description,icon] of categories) {
    await prisma.category.upsert({
      where:{name},
      update:{description,icon,slug:slug(name),status:'active'},
      create:{name,description,icon,slug:slug(name),status:'active'},
    });
  }
  if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const password_hash = await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD,12);
    await prisma.user.upsert({
      where: { email },
      update: { password_hash, role: 'admin', status: 'active' },
      create: {
        name: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador',
        email,
        password_hash,
        role: 'admin',
      },
    });
    console.log(`Administrador bootstrap actualizado: ${email}`);
  }
  console.log('Seed PostgreSQL completado.');
}
seed().catch(error=>{ console.error(error); process.exitCode=1; }).finally(()=>prisma.$disconnect());
