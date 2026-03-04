const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, canView, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

router.use(authMiddleware);

// Tüm paketleri getir (Operatör adıyla birlikte)
// authMiddleware zaten yukarda tanımlı, tüm giriş yapmış kullanıcılar paket listesini görebilir
router.get('/', (req, res) => {
  try {
    const packages = db.prepare(`
      SELECT p.*, o.name as operator_name 
      FROM packages p
      LEFT JOIN operators o ON p.operator_id = o.id
      ORDER BY p.name ASC
    `).all();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni paket ekle
router.post('/', canEdit('settings'), (req, res) => {
  try {
    const { name, type, operator_id, price, data_limit, sms_limit, minutes_limit, features } = req.body;
    if (!name || !type || !operator_id) {
      return res.status(400).json({ error: "Paket adı, tipi ve operatörü zorunludur." });
    }
    const validTypes = ['m2m', 'data', 'voice']; // 'general' iptal edildi
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Geçersiz paket tipi. İzin verilenler: ${validTypes.join(', ')}` });
    }

    const stmt = db.prepare(`
      INSERT INTO packages (name, type, operator_id, price, data_limit, sms_limit, minutes_limit, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Fiyatı float olarak al
    const parsedPrice = parseFloat(price) || 0;
    const pData = data_limit !== '' && data_limit != null ? parseFloat(data_limit) : null;
    const pSms = sms_limit !== '' && sms_limit != null ? parseInt(sms_limit, 10) : null;
    const pMin = minutes_limit !== '' && minutes_limit != null ? parseInt(minutes_limit, 10) : null;
    
    const info = stmt.run(name, type, operator_id, parsedPrice, pData, pSms, pMin, features || '');

    logActivity(req, 'CREATE', 'PACKAGES', info.lastInsertRowid, { name, type });
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Paket güncelle
router.put('/:id', canEdit('settings'), (req, res) => {
  try {
    const { name, type, operator_id, price, data_limit, sms_limit, minutes_limit, features } = req.body;
    if (!name || !type || !operator_id) {
      return res.status(400).json({ error: "Paket adı, tipi ve operatörü zorunludur." });
    }
    const validTypes = ['m2m', 'data', 'voice'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Geçersiz paket tipi. İzin verilenler: ${validTypes.join(', ')}` });
    }

    const stmt = db.prepare(`
      UPDATE packages 
      SET name = ?, type = ?, operator_id = ?, price = ?, data_limit = ?, sms_limit = ?, minutes_limit = ?, features = ?
      WHERE id = ?
    `);
    
    const parsedPrice = parseFloat(price) || 0;
    const pData = data_limit !== '' && data_limit != null ? parseFloat(data_limit) : null;
    const pSms = sms_limit !== '' && sms_limit != null ? parseInt(sms_limit, 10) : null;
    const pMin = minutes_limit !== '' && minutes_limit != null ? parseInt(minutes_limit, 10) : null;

    stmt.run(name, type, operator_id, parsedPrice, pData, pSms, pMin, features || '', req.params.id);

    logActivity(req, 'UPDATE', 'PACKAGES', req.params.id, { name, type });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Paket sil
router.delete('/:id', canEdit('settings'), (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if package is used by any SIMs
    const checkQuery = `
      SELECT (
        (SELECT COUNT(*) FROM sim_m2m WHERE package_id = ?) +
        (SELECT COUNT(*) FROM sim_data WHERE package_id = ?) +
        (SELECT COUNT(*) FROM sim_voice WHERE package_id = ?)
      ) as usageCount
    `;
    const usage = db.prepare(checkQuery).get(id, id, id);
    
    if (usage && usage.usageCount > 0) {
      // Etkilenen hatlardan ilk 5'ini listele (kullanıcı bilgilendirmesi için)
      const affectedRows = [
        ...db.prepare(`SELECT COALESCE(phone_no, iccid, 'ID:'||id) as label FROM sim_m2m WHERE package_id = ? LIMIT 3`).all(id),
        ...db.prepare(`SELECT COALESCE(phone_no, iccid, 'ID:'||id) as label FROM sim_data WHERE package_id = ? LIMIT 3`).all(id),
        ...db.prepare(`SELECT COALESCE(phone_no, iccid, 'ID:'||id) as label FROM sim_voice WHERE package_id = ? LIMIT 3`).all(id),
      ].slice(0, 5).map(r => r.label);
      const moreCount = usage.usageCount - affectedRows.length;
      const listStr = affectedRows.join(', ') + (moreCount > 0 ? ` ve ${moreCount} hat daha` : '');
      return res.status(400).json({ error: `Bu paket ${usage.usageCount} hat tarafından kullanılıyor. Önce paketi kaldırın.\nEtkilenen hatlar: ${listStr}` });
    }

    db.prepare('DELETE FROM packages WHERE id = ?').run(id);

    logActivity(req, 'DELETE', 'PACKAGES', id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
