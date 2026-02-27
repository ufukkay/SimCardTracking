const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM operators ORDER BY name').all());
});

router.post('/', adminOnly, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Operatör adı zorunludur.' });
  const existing = db.prepare('SELECT id FROM operators WHERE name = ?').get(name);
  if (existing) return res.status(409).json({ message: 'Bu operatör zaten mevcut.' });
  const result = db.prepare('INSERT INTO operators (name) VALUES (?)').run(name);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Operatör eklendi.' });
});

router.delete('/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM operators WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Operatör bulunamadı.' });
  res.json({ message: 'Operatör silindi.' });
});

module.exports = router;
