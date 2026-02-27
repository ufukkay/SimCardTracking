const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/voice
router.get('/', (req, res) => {
  let query = 'SELECT * FROM sim_voice WHERE 1=1';
  const params = [];
  if (req.query.operator) { query += ' AND operator = ?'; params.push(req.query.operator); }
  if (req.query.status)   { query += ' AND status = ?';   params.push(req.query.status); }
  if (req.query.search)   {
    query += ' AND (assigned_to LIKE ? OR phone_no LIKE ? OR iccid LIKE ? OR department LIKE ? OR assigned_company LIKE ?)';
    const s = `%${req.query.search}%`;
    params.push(s, s, s, s, s);
  }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sim_voice WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { iccid, phone_no, operator, status, assigned_to, department, assigned_company, notes } = req.body;
  if (!operator) return res.status(400).json({ message: 'Operatör zorunludur.' });
  const result = db.prepare(`
    INSERT INTO sim_voice (iccid, phone_no, operator, status, assigned_to, department, assigned_company, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(iccid, phone_no, operator, status || 'active', assigned_to, department, assigned_company, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Ses hattı eklendi.' });
});

router.put('/:id', (req, res) => {
  const { iccid, phone_no, operator, status, assigned_to, department, assigned_company, notes } = req.body;
  const result = db.prepare(`
    UPDATE sim_voice SET iccid=?, phone_no=?, operator=?, status=?, assigned_to=?,
    department=?, assigned_company=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(iccid, phone_no, operator, status, assigned_to, department, assigned_company, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'Ses hattı güncellendi.' });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sim_voice WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'Ses hattı silindi.' });
});

module.exports = router;
