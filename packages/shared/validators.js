// ============================================
// Validadores compartidos — Integra Sutec
// ============================================

/**
 * Validate Guatemalan NIT (Número de Identificación Tributaria)
 * Format: XXXXXXXX-X (digits with check digit)
 */
function isValidNit(nit) {
  if (!nit || typeof nit !== 'string') return false;

  const cleaned = nit.replace(/[-\s]/g, '').toUpperCase();

  if (cleaned === 'CF' || cleaned === 'C/F') return true;

  if (!/^\d+[0-9K]$/.test(cleaned)) return false;

  const digits = cleaned.slice(0, -1);
  const expectedCheck = cleaned.slice(-1);

  let factor = digits.length + 1;
  let total = 0;
  for (const d of digits) {
    total += parseInt(d, 10) * factor;
    factor--;
  }

  const remainder = (11 - (total % 11)) % 11;
  const checkChar = remainder === 10 ? 'K' : String(remainder);

  return checkChar === expectedCheck;
}

/**
 * Validate Guatemalan phone number
 */
function isValidGtPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  return /^(502)?\d{8}$/.test(cleaned);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Format currency in Quetzales
 */
function formatGTQ(amount) {
  return `Q${Number(amount).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

module.exports = {
  isValidNit,
  isValidGtPhone,
  isValidEmail,
  formatGTQ,
};
