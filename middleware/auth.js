const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'simkart_gizli_anahtar_2024';

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

module.exports = { authMiddleware, adminOnly };
