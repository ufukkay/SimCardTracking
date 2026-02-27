const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/data
router.get('/', (req, res) => {
  let query = 'SELECT * FROM sim_data WHERE 1=1';
  const params = [];
  if (req.query.operator) { query += ' AND operator = ?'; params.push(req.query.operator); }
  if (req.query.status)   { query += ' AND status = ?';   params.push(req.query.status); }
  if (req.query.search)   { query += ' AND (location LIKE ? OR phone_no LIKE ? OR iccid LIKE ?)'; const s = `%${req.query.search}%`; params.push(s, s, s); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM sim_data WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json(row);
});

router.post('/', (req, res) => {
  const { iccid, phone_no, operator, status, location, notes } = req.body;
  if (!operator) return res.status(400).json({ message: 'Operatör zorunludur.' });
  const result = db.prepare(`
    INSERT INTO sim_data (iccid, phone_no, operator, status, location, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(iccid, phone_no, operator, status || 'active', location, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Data hattı eklendi.' });
});

router.put('/:id', (req, res) => {
  const { iccid, phone_no, operator, status, location, notes } = req.body;
  const result = db.prepare(`
    UPDATE sim_data SET iccid=?, phone_no=?, operator=?, status=?, location=?, notes=?,
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(iccid, phone_no, operator, status, location, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'Data hattı güncellendi.' });
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sim_data WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'Data hattı silindi.' });
});

// POST /api/data/bulk-delete
router.post('/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Geçersiz ID listesi.' });
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM sim_data WHERE id IN (${placeholders})`).run(...ids);
  res.json({ message: `${result.changes} kayıt başarıyla silindi.` });
});

// POST /api/data/bulk-update
router.post('/bulk-update', (req, res) => {
  const { ids, data } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Geçersiz ID listesi.' });
  if (!data || Object.keys(data).length === 0) return res.status(400).json({ message: 'Güncellenecek veri bulunamadı.' });

  const fields = [];
  const params = [];
  const allowedFields = ['operator', 'status', 'location', 'notes'];
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key) && data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  });

  if (fields.length === 0) return res.status(400).json({ message: 'Güncellenecek geçerli alan bulunamadı.' });
  fields.push('updated_at = CURRENT_TIMESTAMP');
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE sim_data SET ${fields.join(', ')} WHERE id IN (${placeholders})`;
  const result = db.prepare(query).run(...params, ...ids);
  res.json({ message: `${result.changes} kayıt başarıyla güncellendi.` });
});

module.exports = router;
