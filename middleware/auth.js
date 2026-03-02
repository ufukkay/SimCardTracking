const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'simkart_gizli_anahtar_2024';

// ─── Core Auth ───────────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Yetkilendirme gerekli.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token bulunamadı.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Bu işlem için admin yetkisi gereklidir.' });
  next();
}

// ─── Granular Permission Helpers ─────────────────────────────────────────────
// Parses permissions JSON from the DB for the current user.
// Admin users bypass all permission checks.
//
// Permission JSON format:
//   { "m2m": {"view": true, "edit": true}, "data": {...}, "voice": {...} }

function getDbUser(req) {
  // Lazily require db to avoid circular dependency at module load time
  const db = require('../database/db');
  return db.prepare('SELECT role, permissions FROM users WHERE id = ?').get(req.user.id);
}

function parsePermissions(dbUser) {
  if (!dbUser || !dbUser.permissions) return {};
  try { return JSON.parse(dbUser.permissions); } catch { return {}; }
}

/**
 * Middleware factory: checks that the current user can VIEW the given module.
 * Admin users always pass. Non-admins need permissions.{module}.view === true.
 * @param {'m2m'|'data'|'voice'} module
 */
function canView(module) {
  return (req, res, next) => {
    const dbUser = getDbUser(req);
    if (!dbUser) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    if (dbUser.role === 'admin') return next();

    const perms = parsePermissions(dbUser);
    if (perms[module]?.view) return next();
    return res.status(403).json({ message: `${module.toUpperCase()} hatlarını görüntüleme yetkiniz yok.` });
  };
}

/**
 * Middleware factory: checks that the current user can EDIT the given module.
 * Admin users always pass. Non-admins need permissions.{module}.edit === true.
 * @param {'m2m'|'data'|'voice'} module
 */
function canEdit(module) {
  return (req, res, next) => {
    const dbUser = getDbUser(req);
    if (!dbUser) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    if (dbUser.role === 'admin') return next();

    const perms = parsePermissions(dbUser);
    if (perms[module]?.edit) return next();
    return res.status(403).json({ message: `${module.toUpperCase()} hatlarını düzenleme yetkiniz yok.` });
  };
}

module.exports = { authMiddleware, adminOnly, canView, canEdit };
