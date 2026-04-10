const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

router.use(authMiddleware);

router.get('/', (req, res) => {
  let q = 'SELECT * FROM personnel WHERE 1=1';
  const p = [];
  if (req.query.search) {
    q += ' AND (first_name LIKE ? OR last_name LIKE ? OR department LIKE ? OR company LIKE ? OR cost_center LIKE ?)';
    const s = `%${req.query.search}%`;
    p.push(s, s, s, s, s);
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
  const { first_name, last_name, department, company, cost_center, phone, notes } = req.body;
  if (!first_name || !last_name) return res.status(400).json({ message: 'Ad ve soyad zorunludur.' });
  const result = db.prepare('INSERT INTO personnel (first_name, last_name, department, company, cost_center, phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(first_name, last_name, department, company, cost_center, phone, notes);

  logActivity(req, 'CREATE', 'PERSONNEL', result.lastInsertRowid, { first_name, last_name });
  res.status(201).json({ id: result.lastInsertRowid, message: 'Personel eklendi.' });
});

router.put('/:id', adminOnly, (req, res) => {
  const { first_name, last_name, department, company, cost_center, phone, notes } = req.body;
  const result = db.prepare('UPDATE personnel SET first_name=?, last_name=?, department=?, company=?, cost_center=?, phone=?, notes=? WHERE id=?').run(first_name, last_name, department, company, cost_center, phone, notes, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Personel bulunamadı.' });

  logActivity(req, 'UPDATE', 'PERSONNEL', req.params.id, { first_name, last_name });
  res.json({ message: 'Personel güncellendi.' });
});

router.delete('/:id', adminOnly, (req, res) => {
  try {
    // Check for references in sim_voice or invoices if we want to be strict
    // For now, we'll just try to delete and catch DB errors
    const result = db.prepare('DELETE FROM personnel WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Personel bulunamadı.' });

    logActivity(req, 'DELETE', 'PERSONNEL', req.params.id);
    res.json({ message: 'Personel silindi.' });
  } catch (err) {
    console.error('[DELETE_PERSONNEL_ERROR]', err);
    if (err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ message: 'Bu personel başka kayıtlarda kullanıldığı için silinemez.' });
    }
    res.status(500).json({ message: 'Personel silinirken bir hata oluştu.', error: err.message });
  }
});

router.post('/bulk-update', adminOnly, (req, res) => {
  const { ids, data } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Geçerli personel listesi gönderin.' });
  }
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'Güncellenecek alan seçilmedi.' });
  }

  const allowed = ['department', 'company', 'cost_center', 'phone', 'notes'];
  const assignments = [];
  const params = [];
  allowed.forEach(key => {
    if (data[key] !== undefined && data[key] !== '') {
      assignments.push(`${key} = ?`);
      params.push(data[key]);
    }
  });

  if (assignments.length === 0) {
    return res.status(400).json({ message: 'Geçerli alan bulunamadı.' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE personnel SET ${assignments.join(', ')} WHERE id IN (${placeholders})`;
  const result = db.prepare(query).run(...params, ...ids);

  logActivity(req, 'BULK_UPDATE', 'PERSONNEL', ids.join(','), { count: result.changes, updates: data });
  res.json({ message: `${result.changes} personel güncellendi.`, affected: result.changes });
});

router.post('/bulk-delete', adminOnly, (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Silinecek personel listesi gönderin.' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM personnel WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    logActivity(req, 'BULK_DELETE', 'PERSONNEL', ids.join(','), { count: result.changes });
    res.json({ message: `${result.changes} personel silindi.`, affected: result.changes });
  } catch (err) {
    console.error('[BULK_DELETE_PERSONNEL_ERROR]', err);
    if (err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ message: 'Bazı personeller başka kayıtlarda kullanıldığı için silinemedi.' });
    }
    res.status(500).json({ message: 'Toplu silme işlemi sırasında bir hata oluştu.', error: err.message });
  }
});

module.exports = router;
