const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  let q = 'SELECT * FROM personnel WHERE 1=1';
  const p = [];
  if (req.query.search) {
    q += ' AND (first_name LIKE ? OR last_name LIKE ? OR department LIKE ? OR company LIKE ?)';
    const s = `%${req.query.search}%`;
    p.push(s, s, s, s);
  }
  q += ' ORDER BY last_name, first_name';
  res.json(db.prepare(q).all(...p));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM personnel WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Personel bulunamadı.' });
  res.json(row);
});

router.post('/', adminOnly, (req, res) => {
  const { first_name, last_name, department, company, phone, notes } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ message: 'Ad ve soyad zorunludur.' });
  const result = db.prepare('INSERT INTO personnel (first_name, last_name, department, company, phone, notes) VALUES (?, ?, ?, ?, ?, ?)').run(first_name, last_name, department, company, phone, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Personel eklendi.' });
});

router.put('/:id', adminOnly, (req, res) => {
  const { first_name, last_name, department, company, phone, notes } = req.body;
  const result = db.prepare('UPDATE personnel SET first_name=?, last_name=?, department=?, company=?, phone=?, notes=? WHERE id=?').run(first_name, last_name, department, company, phone, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Personel bulunamadı.' });
  res.json({ message: 'Personel güncellendi.' });
});

router.delete('/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM personnel WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Personel bulunamadı.' });
  res.json({ message: 'Personel silindi.' });
});

module.exports = router;
