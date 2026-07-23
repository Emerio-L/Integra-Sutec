require('dotenv').config({ path: '../../.env' });
const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../src/config/prisma');
const media = require('../src/services/cloudinaryMedia');

const root = path.resolve(__dirname,'..');
const localFile = url => {
  if (!url) return null;
  const pathname = url.startsWith('http') ? new URL(url).pathname : url;
  return pathname.startsWith('/uploads/') ? path.join(root,'public',pathname) : null;
};

async function products() {
  for (const product of await prisma.product.findMany()) {
    const urls = Array.isArray(product.images) ? product.images : [];
    const ids = Array.isArray(product.image_public_ids) ? product.image_public_ids : [];
    let changed=false;
    for (let i=0;i<urls.length;i++) {
      const file=localFile(urls[i]);
      if (!file || !fs.existsSync(file)) continue;
      const uploaded=await media.uploadProductImage(fs.readFileSync(file));
      urls[i]=uploaded.secure_url; ids[i]=uploaded.public_id; changed=true;
    }
    if (changed) await prisma.product.update({where:{id:product.id},data:{images:urls,image_public_ids:ids}});
  }
}
async function banner() {
  const metadataPath = path.join(root,'.local','banner.json');
  if (!fs.existsSync(metadataPath)) return;
  const item = JSON.parse(fs.readFileSync(metadataPath,'utf8'));
  const data = { title:item.title || 'Banner principal', subtitle:item.subtitle || null, mediaType:item.mediaType || 'IMAGE', altText:item.altText || null, isActive:item.isActive !== false, displayOrder:Number(item.displayOrder)||0 };
  for (const [urlField,idField,kind] of [
    ['desktopImageUrl','desktopImagePublicId','image'],['mobileImageUrl','mobileImagePublicId','image'],
    ['desktopVideoUrl','desktopVideoPublicId','video'],['mobileVideoUrl','mobileVideoPublicId','video'],
    ['posterImageUrl','posterImagePublicId','poster'],
  ]) {
    const file=localFile(item[urlField]);
    if (!file || !fs.existsSync(file)) continue;
    const uploaded = kind === 'video' ? await media.uploadVideo(fs.readFileSync(file)) : await media.uploadImage(fs.readFileSync(file),{poster:kind==='poster'});
    data[urlField]=uploaded.secure_url; data[idField]=uploaded.public_id;
    if (kind==='video' && urlField==='desktopVideoUrl') Object.assign(data,{videoDuration:uploaded.duration,videoWidth:uploaded.width,videoHeight:uploaded.height,videoFormat:uploaded.format,videoBytes:uploaded.bytes});
  }
  await prisma.heroBanner.upsert({where:{id:item.id},update:data,create:{id:item.id,...data}});
}
async function run() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new Error('Faltan credenciales Cloudinary.');
  await products();
  await banner();
  console.log('Medios locales migrados a Cloudinary.');
}
run().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
