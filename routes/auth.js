const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'simkart_gizli_anahtar_2024';
const JWT_EXPIRES = '8h';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gerekli.' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user)
    return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      company: user.company,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token gerekli.' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, first_name, last_name, company, email, phone, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    res.json(user);
  } catch {
    res.status(401).json({ message: 'Geçersiz token.' });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
 
