// Centralized error handler middleware
function errorHandler(err, req, res, _next) {
  console.error('❌ Error:', err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Error de validación', details: messages });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    return res.status(409).json({ error: `El campo '${field}' ya existe` });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'No fue posible guardar el producto. Revisa los campos numéricos e inténtalo nuevamente.' });
  }

  if (err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'valor único';
    return res.status(409).json({ error: `Ya existe un registro con el mismo ${fields}.` });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'La categoría o marca seleccionada ya no está disponible. Actualiza la página e inténtalo nuevamente.' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
  });
}

module.exports = errorHandler;
