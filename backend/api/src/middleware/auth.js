const jwt = require('jsonwebtoken');
const User = require('../modules/auth/user.model');

/**
 * Authenticate JWT token from Authorization header
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    // Also accept token via ?token= query param (for direct browser PDF/download URLs)
    const rawToken = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.query.token;
    if (!rawToken) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    const token = rawToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password_hash');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/**
 * Authorize by user role(s)
 * @param  {...string} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
