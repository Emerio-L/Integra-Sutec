require('dotenv').config({ path: '../../.env' });
const bcrypt = require('bcryptjs');
const prisma = require('./config/prisma');

const categories = [
  ['Computadoras y Laptops','Equipos de cómputo portátiles y de escritorio','💻'],
  ['Redes y Conectividad','Routers, switches, access points y cableado','🌐'],
  ['Impresoras y Escáneres','Equipos de impresión y digitalización','🖨️'],
  ['Almacenamiento','Discos duros, SSD, memorias USB y NAS','💾'],
  ['Accesorios','Teclados, mouses, monitores y periféricos','🖱️'],
  ['Software y Licencias','Licencias de software empresarial','📀'],
  ['Servidores','Servidores rack, torre y componentes','🖥️'],
  ['Seguridad','Cámaras, UPS, reguladores y antivirus','🔒'],
];

const slug = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada.');
  for (const [name,description,icon] of categories) {
    await prisma.category.upsert({ where:{name}, update:{description,icon}, create:{name,description,icon,slug:slug(name)} });
  }
  if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
    const password_hash = await bcrypt.hash(process.env.BOOTSTRAP_ADMIN_PASSWORD,12);
    await prisma.user.upsert({ where:{email}, update:{status:'active'}, create:{name:process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador',email,password_hash,role:'admin'} });
  }
  console.log('Seed PostgreSQL completado.');
}
seed().catch(error=>{ console.error(error); process.exitCode=1; }).finally(()=>prisma.$disconnect());
