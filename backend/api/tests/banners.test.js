const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { _test } = require('../src/modules/banners/banner.controller');
const { IMAGE_MIMES, VIDEO_MIMES, LIMITS } = require('../src/middleware/bannerUpload');

test('rechaza imagen sin archivo de escritorio', () => assert.throws(() => _test.validateRequired('IMAGE', {}), /imagen de escritorio/i));
test('rechaza video sin poster', () => assert.throws(() => _test.validateRequired('VIDEO', { desktopVideoUrl: 'video' }), /poster/i));
test('acepta formatos definidos y límites configurables', () => {
  assert.equal(IMAGE_MIMES.has('image/svg+xml'), false);
  assert.equal(VIDEO_MIMES.has('video/mp4'), true);
  assert.ok(LIMITS.imageBytes > 0 && LIMITS.videoBytes > LIMITS.imageBytes);
});
test('rechaza fechas invertidas', () => assert.throws(() => _test.validateDates(new Date('2026-02-02'), new Date('2026-01-01')), /posterior/i));
test('el componente público fija reproducción segura y fallback', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../../frontend/store/src/components/HeroMedia.astro'), 'utf8');
  for (const token of ['autoplay', 'muted', 'loop', 'playsinline', 'poster=', 'prefers-reduced-motion', 'saveData']) assert.match(source, new RegExp(token));
  assert.doesNotMatch(source, /<video[^>]*controls/i);
});
test('la previsualización administrativa incluye controles', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../../frontend/admin/src/pages/Banners.jsx'), 'utf8');
  assert.match(source, /playsInline controls/);
});
