// Simple input validation helpers

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 255;
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

function sanitizeString(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Emri duhet të jetë 2-100 karaktere' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Fjalëkalimi duhet të jetë 6-128 karaktere' });
  }
  req.body.name = sanitizeString(name);
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Fjalëkalimi mungon' });
  }
  req.body.email = email.trim().toLowerCase();
  next();
}

function validateCheckout(req, res, next) {
  const { packageId, email } = req.body;
  if (!packageId || !Number.isInteger(Number(packageId)) || Number(packageId) < 1) {
    return res.status(400).json({ error: 'ID e paketës e pavlefshme' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email i pavlefshëm' });
  }
  req.body.email = email.trim().toLowerCase();
  req.body.packageId = Number(packageId);
  next();
}

module.exports = { validateRegister, validateLogin, validateCheckout, validateEmail, sanitizeString };
