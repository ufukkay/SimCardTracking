const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/m2m
router.get('/', (req, res) => {
  let query = 'SELECT * FROM sim_m2m WHERE 1=1';
  const params = [];
  if (req.query.operator) { query += ' AND operator = ?'; params.push(req.query.operator); }
  if (req.query.status)   { query += ' AND status = ?';   params.push(req.query.status); }
  if (req.query.search)   { query += ' AND (plate_no LIKE ? OR phone_no LIKE ? OR iccid LIKE ?)'; const s = `%${req.query.search}%`; params.push(s, s, s); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// GET /api/m2m/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sim_m2m WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json(row);
});

// POST /api/m2m
router.post('/', (req, res) => {
  const { iccid, phone_no, operator, status, plate_no, notes } = req.body;
  if (!operator) return res.status(400).json({ message: 'Operatör zorunludur.' });
  const result = db.prepare(`
    INSERT INTO sim_m2m (iccid, phone_no, operator, status, plate_no, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(iccid, phone_no, operator, status || 'active', plate_no, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'M2M hattı eklendi.' });
});

// PUT /api/m2m/:id
router.put('/:id', (req, res) => {
  const { iccid, phone_no, operator, status, plate_no, notes } = req.body;
  const result = db.prepare(`
    UPDATE sim_m2m SET iccid=?, phone_no=?, operator=?, status=?, plate_no=?, notes=?,
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(iccid, phone_no, operator, status, plate_no, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'M2M hattı güncellendi.' });
});

// DELETE /api/m2m/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sim_m2m WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'M2M hattı silindi.' });
});

module.exports = router;
