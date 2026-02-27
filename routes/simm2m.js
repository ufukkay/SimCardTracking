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
  if (req.query.vehicle_type) { query += ' AND vehicle_type = ?'; params.push(req.query.vehicle_type); }
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
  const { iccid, phone_no, operator, status, plate_no, vehicle_type, notes } = req.body;
  if (!operator) return res.status(400).json({ message: 'Operatör zorunludur.' });
  
  // Auto-sync vehicle if a plate number is provided
  if (plate_no && plate_no.trim() !== '') {
    db.prepare(`
      INSERT INTO vehicles (plate_no, vehicle_type)
      VALUES (?, ?)
      ON CONFLICT(plate_no) DO UPDATE SET
        vehicle_type = COALESCE(excluded.vehicle_type, vehicle_type)
    `).run(plate_no.trim(), vehicle_type || null);
  }

  const result = db.prepare(`
    INSERT INTO sim_m2m (iccid, phone_no, operator, status, plate_no, vehicle_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(iccid, phone_no, operator, status || 'active', plate_no, vehicle_type, notes);
  res.status(201).json({ id: result.lastInsertRowid, message: 'M2M hattı eklendi.' });
});

// PUT /api/m2m/:id
router.put('/:id', (req, res) => {
  const { iccid, phone_no, operator, status, plate_no, vehicle_type, notes } = req.body;
  
  // Auto-sync vehicle if a plate number is provided
  if (plate_no && plate_no.trim() !== '') {
    db.prepare(`
      INSERT INTO vehicles (plate_no, vehicle_type)
      VALUES (?, ?)
      ON CONFLICT(plate_no) DO UPDATE SET
        vehicle_type = COALESCE(excluded.vehicle_type, vehicle_type)
    `).run(plate_no.trim(), vehicle_type || null);
  }

  const result = db.prepare(`
    UPDATE sim_m2m SET iccid=?, phone_no=?, operator=?, status=?, plate_no=?, vehicle_type=?, notes=?,
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(iccid, phone_no, operator, status, plate_no, vehicle_type, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'M2M hattı güncellendi.' });
});

// DELETE /api/m2m/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sim_m2m WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json({ message: 'M2M hattı silindi.' });
});

// POST /api/m2m/bulk-delete
router.post('/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Geçersiz ID listesi.' });
  
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM sim_m2m WHERE id IN (${placeholders})`).run(...ids);
  res.json({ message: `${result.changes} kayıt başarıyla silindi.` });
});

// POST /api/m2m/bulk-update
router.post('/bulk-update', (req, res) => {
  const { ids, data } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Geçersiz ID listesi.' });
  if (!data || Object.keys(data).length === 0) return res.status(400).json({ message: 'Güncellenecek veri bulunamadı.' });

  const fields = [];
  const params = [];
  
  // Sadece izin verilen alanların güncellenmesini sağla
  const allowedFields = ['operator', 'status', 'vehicle_type', 'notes'];
  Object.keys(data).forEach(key => {
    if (allowedFields.includes(key) && data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  });

  if (fields.length === 0) return res.status(400).json({ message: 'Güncellenecek geçerli alan bulunamadı.' });

  fields.push('updated_at = CURRENT_TIMESTAMP');
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE sim_m2m SET ${fields.join(', ')} WHERE id IN (${placeholders})`;
  const result = db.prepare(query).run(...params, ...ids);
  
  res.json({ message: `${result.changes} kayıt başarıyla güncellendi.` });
});

module.exports = router;
