const jwt = require('jsonwebtoken');
const User = require('./user.model');

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = await User.findOne({ email }).select('+password_hash');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokens = generateTokens(user._id);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const tokens = generateTokens(user._id);
    res.json(tokens);
  } catch (error) {
    return res.status(401).json({ error: 'Token de refresco inválido o expirado' });
  }
}

async function getProfile(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, refresh, getProfile };
