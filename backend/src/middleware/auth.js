const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[AUTH] WARNING: JWT_SECRET not set in production! Falling back to dev secret; set JWT_SECRET immediately.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'shqiponja-dev-secret';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mungon' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token i pavlefshëm' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Vetëm admini ka qasje' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
