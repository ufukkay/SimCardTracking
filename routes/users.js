const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);

// GET /api/users
router.get('/', adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, username, first_name, last_name, company, email, phone, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

// POST /api/users
router.post('/', adminOnly, (req, res) => {
  const { username, first_name, last_name, company, email, phone, role, password } = req.body;
  if (!username || !password || !first_name || !last_name)
    return res.status(400).json({ message: 'Kullanıcı adı, ad, soyad ve şifre zorunludur.' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, first_name, last_name, company, email, phone, role, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(username, first_name, last_name, company, email, phone, role || 'user', hash);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Kullanıcı oluşturuldu.' });
});

// PUT /api/users/:id
router.put('/:id', adminOnly, (req, res) => {
  const { first_name, last_name, company, email, phone, role, password } = req.body;
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  }
  const result = db.prepare(`
    UPDATE users SET first_name=?, last_name=?, company=?, email=?, phone=?, role=? WHERE id=?
  `).run(first_name, last_name, company, email, phone, role, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
  res.json({ message: 'Kullanıcı güncellendi.' });
});

// DELETE /api/users/:id
router.delete('/:id', adminOnly, (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message: 'Kendi hesabınızı silemezsiniz.' });
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
  res.json({ message: 'Kullanıcı silindi.' });
});

// PUT /api/users/me/password — kendi şifresini değiştir
router.put('/me/password', (req, res) => {
  const { old_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(old_password, user.password_hash))
    return res.status(400).json({ message: 'Mevcut şifre hatalı.' });
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({ message: 'Şifre güncellendi.' });
});

module.exports = router;
