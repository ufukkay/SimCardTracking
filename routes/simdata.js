const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, canView, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

// Placeholder for syncLocation function, assuming it adds new locations to a separate table if they don't exist.
// This function is not provided in the original context, but is called in the requested changes.
const syncLocation = (location) => {
  if (location) {
    const existingLocation = db.prepare('SELECT id FROM locations WHERE name = ?').get(location);
    if (!existingLocation) {
      db.prepare('INSERT INTO locations (name) VALUES (?)').run(location);
    }
  }
};

router.use(authMiddleware);

// GET /api/data
router.get('/', canView('data'), (req, res) => {
  let query = `
    SELECT sim_data.*, p.name as package_name 
    FROM sim_data 
    LEFT JOIN packages p ON sim_data.package_id = p.id 
    WHERE 1=1
  `;
  const params = [];
  if (req.query.operator) { query += ' AND sim_data.operator = ?'; params.push(req.query.operator); }
  if (req.query.status)   { query += ' AND sim_data.status = ?';   params.push(req.query.status); }
  if (req.query.location) { query += ' AND sim_data.location = ?'; params.push(req.query.location); }
  if (req.query.search) {
    query += ' AND (sim_data.phone_no LIKE ? OR sim_data.iccid LIKE ?)';
    const s = `%${req.query.search}%`;
    params.push(s, s);
  }
  query += ' ORDER BY sim_data.id DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', canView('data'), (req, res) => {
  const row = db.prepare('SELECT * FROM sim_data WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  res.json(row);
});
// POST /api/data
router.post('/', canEdit('data'), (req, res) => {
  const { iccid, phone_no, operator, status, location, notes, package_id } = req.body;
  if (!operator) return res.status(400).json({ message: 'Operatör zorunludur.' });

  syncLocation(location);

  const result = db.prepare(`
    INSERT INTO sim_data (iccid, phone_no, operator, status, location, notes, package_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(iccid || null, phone_no || null, operator, status || 'active', 
         location || null, notes || null, package_id || null);
  
  logActivity(req, 'CREATE', 'DATA', result.lastInsertRowid, { iccid, phone_no, location });
  res.status(201).json({ id: result.lastInsertRowid, message: 'Data hattı eklendi.' });
});
// PUT /api/data/:id
router.put('/:id', canEdit('data'), (req, res) => {
  const { iccid, phone_no, operator, status, location, notes, package_id } = req.body;

  syncLocation(location);

  const result = db.prepare(`
    UPDATE sim_data 
    SET iccid=?, phone_no=?, operator=?, status=?, location=?, notes=?, package_id=?,
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(iccid || null, phone_no || null, operator, status,
         location || null, notes || null, package_id || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  
  logActivity(req, 'UPDATE', 'DATA', req.params.id, { iccid, phone_no, location });
  res.json({ message: 'Data hattı güncellendi.' });
});

router.delete('/:id', canEdit('data'), (req, res) => {
  const result = db.prepare('DELETE FROM sim_data WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Kayıt bulunamadı.' });
  
  logActivity(req, 'DELETE', 'DATA', req.params.id);
  res.json({ message: 'Data hattı silindi.' });
});

// POST /api/data/bulk-delete
router.post('/bulk-delete', canEdit('data'), (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Geçersiz ID listesi.' });
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM sim_data WHERE id IN (${placeholders})`).run(...ids);
  
  logActivity(req, 'BULK_DELETE', 'DATA', ids.join(','), { count: result.changes });
  res.json({ message: `${result.changes} kayıt başarıyla silindi.` });
});

// POST /api/data/bulk-update
router.post('/bulk-update', canEdit('data'), (req, res) => {
  const { ids, data } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'Geçersiz ID listesi.' });
  if (!data || Object.keys(data).length === 0) return res.status(400).json({ message: 'Güncellenecek veri bulunamadı.' });

  const fields = [];
  const params = [];
  const allowedFields = ['operator', 'status', 'location', 'notes', 'package_id'];
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
  
  logActivity(req, 'BULK_UPDATE', 'DATA', ids.join(','), { count: result.changes, updates: data });
  res.json({ message: `${result.changes} kayıt başarıyla güncellendi.` });
});

module.exports = router;
