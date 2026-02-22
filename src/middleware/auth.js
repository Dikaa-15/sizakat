const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/http-error');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return req.cookies?.token || null;
}

function authenticate(req, _res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new HttpError(401, 'Unauthorized'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_error) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

function authenticateWeb(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (_error) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new HttpError(403, 'Forbidden: admin access required'));
  }

  return next();
}

module.exports = {
  authenticate,
  authenticateWeb,
  requireAdmin
};
