// ============================================
// Mappers snake_case (DB) <-> camelCase (API)
// ============================================

/**
 * Convert a snake_case string to camelCase
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a camelCase string to snake_case
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert all keys of an object from snake_case to camelCase (deep)
 */
function toCamelCase(obj) {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = snakeToCamel(key);
    acc[camelKey] = toCamelCase(value);
    return acc;
  }, {});
}

/**
 * Convert all keys of an object from camelCase to snake_case (deep)
 */
function toSnakeCase(obj) {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = camelToSnake(key);
    acc[snakeKey] = toSnakeCase(value);
    return acc;
  }, {});
}

module.exports = {
  snakeToCamel,
  camelToSnake,
  toCamelCase,
  toSnakeCase,
};
