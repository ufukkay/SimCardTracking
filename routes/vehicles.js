const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  let q = 'SELECT * FROM vehicles WHERE 1=1';
  const p = [];
  if (req.query.search) { q += ' AND plate_no LIKE ?'; p.push(`%${req.query.search}%`); }
  q += ' ORDER BY plate_no';
  res.json(db.prepare(q).all(...p));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Araç bulunamadı.' });
  res.json(row);
});

router.post('/', adminOnly, (req, res) => {
  const { plate_no, vehicle_type, notes } = req.body;
  if (!plate_no) return res.status(400).json({ message: 'Plaka zorunludur.' });
  const existing = db.prepare('SELECT id FROM vehicles WHERE plate_no = ?').get(plate_no);
  if (existing) return res.status(409).json({ message: 'Bu plaka zaten kayıtlı.' });
  const result = db.prepare('INSERT INTO vehicles (plate_no, vehicle_type, notes) VALUES (?, ?, ?)').run(plate_no, vehicle_type, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Araç eklendi.' });
});

router.put('/:id', adminOnly, (req, res) => {
  const { plate_no, vehicle_type, notes } = req.body;
  const result = db.prepare('UPDATE vehicles SET plate_no=?, vehicle_type=?, notes=? WHERE id=?').run(plate_no, vehicle_type, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Araç bulunamadı.' });
  res.json({ message: 'Araç güncellendi.' });
});

router.delete('/:id', adminOnly, (req, res) => {
  const result = db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Araç bulunamadı.' });
  res.json({ message: 'Araç silindi.' });
});

module.exports = router;
