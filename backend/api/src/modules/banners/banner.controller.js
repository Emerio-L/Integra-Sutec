const prisma = require('../../config/prisma');
const media = require('../../services/cloudinaryMedia');
const { LIMITS } = require('../../middleware/bannerUpload');

const file = (req, name) => req.files?.[name]?.[0];
const bool = (value, fallback) => value === undefined ? fallback : value === true || value === 'true';
const date = (value) => value ? new Date(value) : null;
const publicFields = {
  id: true, title: true, subtitle: true, mediaType: true, desktopImageUrl: true,
  mobileImageUrl: true, desktopVideoUrl: true, mobileVideoUrl: true,
  posterImageUrl: true, altText: true, textColorVariant: true, imagePosition: true,
};

function validateDates(startsAt, endsAt) {
  if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime()))) throw Object.assign(new Error('Fecha inválida'), { statusCode: 400 });
  if (startsAt && endsAt && startsAt >= endsAt) throw Object.assign(new Error('La fecha final debe ser posterior a la inicial'), { statusCode: 400 });
}
function validateRequired(type, values) {
  if (type === 'IMAGE' && !values.desktopImageUrl) throw Object.assign(new Error('La imagen de escritorio es obligatoria'), { statusCode: 400 });
  if (type === 'VIDEO' && !values.desktopVideoUrl) throw Object.assign(new Error('El video de escritorio es obligatorio'), { statusCode: 400 });
  if (type === 'VIDEO' && !values.posterImageUrl) throw Object.assign(new Error('El poster es obligatorio para videos'), { statusCode: 400 });
}
function resultData(result, kind) {
  if (kind === 'video') {
    if (!result.duration || !result.width || !result.height || !result.format || !result.bytes) throw Object.assign(new Error('Cloudinary no devolvió metadata válida del video'), { statusCode: 422 });
    if (result.duration > LIMITS.videoDuration) throw Object.assign(new Error(`El video supera ${LIMITS.videoDuration} segundos`), { statusCode: 422 });
    return { url: media.generateVideoUrl(result.public_id), publicId: result.public_id, duration: result.duration, width: result.width, height: result.height, format: result.format, bytes: result.bytes };
  }
  return { url: result.secure_url, publicId: result.public_id };
}
async function cleanup(resources) {
  await Promise.allSettled(resources.map(({ publicId, kind }) => kind === 'video' ? media.deleteVideo(publicId) : media.deleteImage(publicId, kind)));
}
async function uploadFiles(req) {
  const uploaded = [];
  const values = {};
  const jobs = [
    ['desktopImage', 'image', 'desktopImage'], ['mobileImage', 'image', 'mobileImage'],
    ['desktopVideo', 'video', 'desktopVideo'], ['mobileVideo', 'video', 'mobileVideo'],
    ['posterImage', 'poster', 'posterImage'],
  ];
  try {
    for (const [field, kind, prefix] of jobs) {
      const current = file(req, field); if (!current) continue;
      const raw = kind === 'video' ? await media.uploadVideo(current.buffer) : await media.uploadImage(current.buffer, { poster: kind === 'poster' });
      const data = resultData(raw, kind === 'video' ? 'video' : 'image');
      uploaded.push({ publicId: data.publicId, kind });
      values[`${prefix}Url`] = kind === 'poster' ? media.generatePosterUrl(data.publicId) : kind === 'image' ? media.generateImageUrl(data.publicId) : data.url;
      values[`${prefix}PublicId`] = data.publicId;
      if (field === 'desktopVideo') Object.assign(values, { videoDuration: data.duration, videoWidth: data.width, videoHeight: data.height, videoFormat: data.format, videoBytes: data.bytes });
    }
    return { values, uploaded };
  } catch (error) { await cleanup(uploaded); throw error; }
}
function bodyData(req, existing = {}) {
  const mediaType = (req.body.mediaType || existing.mediaType || 'IMAGE').toUpperCase();
  if (!['IMAGE', 'VIDEO'].includes(mediaType)) throw Object.assign(new Error('Tipo de banner inválido'), { statusCode: 400 });
  const startsAt = date(req.body.startsAt); const endsAt = date(req.body.endsAt); validateDates(startsAt, endsAt);
  return {
    title: String(req.body.title || existing.title || '').trim(), subtitle: req.body.subtitle || null,
    mediaType, altText: req.body.altText || null, textColorVariant: req.body.textColorVariant || null,
    imagePosition: req.body.imagePosition || null, isActive: bool(req.body.isActive, existing.isActive ?? true),
    displayOrder: Number(req.body.displayOrder ?? existing.displayOrder ?? 0), startsAt, endsAt,
  };
}
function oldResources(existing, newValues) {
  return [
    ['desktopImagePublicId', 'image'], ['mobileImagePublicId', 'image'], ['desktopVideoPublicId', 'video'],
    ['mobileVideoPublicId', 'video'], ['posterImagePublicId', 'poster'],
  ].filter(([key]) => newValues[key] && existing[key] && newValues[key] !== existing[key]).map(([key, kind]) => ({ publicId: existing[key], kind }));
}

exports.list = async (_req, res, next) => { try { res.json({ items: await prisma.heroBanner.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }) }); } catch (e) { next(e); } };
exports.get = async (req, res, next) => { try { const item = await prisma.heroBanner.findUnique({ where: { id: req.params.id } }); if (!item) return res.status(404).json({ error: 'Banner no encontrado' }); res.json({ item }); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
  let uploaded = [];
  try {
    const base = bodyData(req); if (!base.title) throw Object.assign(new Error('El título es obligatorio'), { statusCode: 400 });
    const result = await uploadFiles(req); uploaded = result.uploaded;
    const values = { ...base, ...result.values }; validateRequired(base.mediaType, values);
    if (base.mediaType === 'IMAGE') Object.assign(values, { desktopVideoUrl: null, desktopVideoPublicId: null, mobileVideoUrl: null, mobileVideoPublicId: null });
    const item = await prisma.heroBanner.create({ data: values });
    console.info('Banner creado', { id: item.id, userId: String(req.user._id) }); res.status(201).json({ item });
  } catch (e) { await cleanup(uploaded); next(e); }
};
exports.update = async (req, res, next) => {
  let uploaded = [];
  try {
    const existing = await prisma.heroBanner.findUnique({ where: { id: req.params.id } }); if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });
    const base = bodyData(req, existing); const result = await uploadFiles(req); uploaded = result.uploaded;
    const values = { ...base, ...result.values }; validateRequired(base.mediaType, { ...existing, ...values });
    if (bool(req.body.removeMobileImage, false)) Object.assign(values, { mobileImageUrl: null, mobileImagePublicId: null });
    if (bool(req.body.removeMobileVideo, false)) Object.assign(values, { mobileVideoUrl: null, mobileVideoPublicId: null });
    if (base.mediaType === 'IMAGE') Object.assign(values, { desktopVideoUrl: null, desktopVideoPublicId: null, mobileVideoUrl: null, mobileVideoPublicId: null, videoDuration: null, videoWidth: null, videoHeight: null, videoFormat: null, videoBytes: null });
    const replaced = oldResources(existing, values);
    if (base.mediaType === 'IMAGE') {
      if (existing.desktopVideoPublicId) replaced.push({ publicId: existing.desktopVideoPublicId, kind: 'video' });
      if (existing.mobileVideoPublicId) replaced.push({ publicId: existing.mobileVideoPublicId, kind: 'video' });
    }
    if (bool(req.body.removeMobileImage, false) && existing.mobileImagePublicId) replaced.push({ publicId: existing.mobileImagePublicId, kind: 'image' });
    if (bool(req.body.removeMobileVideo, false) && existing.mobileVideoPublicId) replaced.push({ publicId: existing.mobileVideoPublicId, kind: 'video' });
    const item = await prisma.heroBanner.update({ where: { id: existing.id }, data: values });
    await cleanup(replaced); console.info('Banner actualizado', { id: item.id, userId: String(req.user._id) }); res.json({ item });
  } catch (e) { await cleanup(uploaded); next(e); }
};
exports.status = async (req, res, next) => { try { const item = await prisma.heroBanner.update({ where: { id: req.params.id }, data: { isActive: Boolean(req.body.isActive) } }); res.json({ item }); } catch (e) { next(e); } };
exports.reorder = async (req, res, next) => { try { if (!Array.isArray(req.body.items)) return res.status(400).json({ error: 'items debe ser una lista' }); await prisma.$transaction(req.body.items.map((item, i) => prisma.heroBanner.update({ where: { id: item.id }, data: { displayOrder: Number(item.displayOrder ?? i) } }))); res.json({ ok: true }); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { const existing = await prisma.heroBanner.delete({ where: { id: req.params.id } }); const resources = [['desktopImagePublicId','image'],['mobileImagePublicId','image'],['desktopVideoPublicId','video'],['mobileVideoPublicId','video'],['posterImagePublicId','poster']].filter(([k]) => existing[k]).map(([k,kind])=>({publicId:existing[k],kind})); await cleanup(resources); console.info('Banner eliminado', { id: existing.id, userId: String(req.user._id) }); res.status(204).end(); } catch (e) { next(e); } };
exports.publicList = async (_req, res, next) => { try { const now = new Date(); const items = await prisma.heroBanner.findMany({ where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] }, orderBy: { displayOrder: 'asc' }, select: publicFields }); res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').json({ items, data: items }); } catch (e) { next(e); } };

exports._test = { validateRequired, validateDates, resultData };
