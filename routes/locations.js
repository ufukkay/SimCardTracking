const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  let q = 'SELECT * FROM locations WHERE 1=1';
  const p = [];
  if (req.query.search) { q += ' AND name LIKE ?'; p.push(`%${req.query.search}%`); }
  q += ' ORDER BY name';
  res.json(db.prepare(q).all(...p));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Lokasyon bulunamadı.' });
  res.json(row);
});

router.post('/', adminOnly, (req, res) => {
  const { name, address, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Lokasyon adı zorunludur.' });
  const existing = db.prepare('SELECT id FROM locations WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ message: 'Bu lokasyon zaten kayıtlı.' });
  const result = db.prepare('INSERT INTO locations (name, address, notes) VALUES (?, ?, ?)').run(name, address, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Lokasyon eklendi.' });
});

router.put('/:id', adminOnly, (req, res) => {
  const { name, address, notes } = req.body;
  const result = db.prepare('UPDATE locations SET name=?, address=?, notes=? WHERE id=?').run(name, address, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Lokasyon bulunamadı.' });
  res.json({ message: 'Lokasyon güncellendi.' });
});

router.delete('/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Lokasyon bulunamadı.' });
  res.json({ message: 'Lokasyon silindi.' });
});

module.exports = router;
