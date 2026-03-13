const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, canEdit } = require('../middleware/auth');
const { logActivity } = require('../middleware/logger');

router.use(authMiddleware);

// POST /api/sim/transfer
router.post('/transfer', canEdit('data'), (req, res) => {
  const { id, currentType, targetType } = req.body;

  if (!id || !currentType || !targetType) {
    return res.status(400).json({ message: 'Eksik parametre: id, currentType ve targetType zorunludur.' });
  }

  if (currentType === targetType) {
    return res.status(400).json({ message: 'Kaynak ve hedef tip aynı olamaz.' });
  }

  const validTypes = ['m2m', 'data', 'voice'];
  if (!validTypes.includes(currentType) || !validTypes.includes(targetType)) {
    return res.status(400).json({ message: 'Geçersiz hat tipi.' });
  }

  const sourceTable = `sim_${currentType}`;
  const targetTable = `sim_${targetType}`;

  try {
    const transaction = db.transaction(() => {
      // 1. Kaynak veriyi bul
      const row = db.prepare(`SELECT * FROM ${sourceTable} WHERE id = ?`).get(id);
      if (!row) throw new Error('Kaynak kayıt bulunamadı.');

      // 2. Hedef tablonun kolonlarını al
      const targetColumns = db.prepare(`PRAGMA table_info(${targetTable})`).all().map(c => c.name);

      // 3. Ortak verileri hazırla
      const transferData = {};
      targetColumns.forEach(col => {
        if (col === 'id' || col === 'created_at' || col === 'updated_at') return;
        
        // Kaynakta varsa al, yoksa null/default bırak
        if (row.hasOwnProperty(col)) {
          transferData[col] = row[col];
        } else {
          transferData[col] = null;
        }
      });

      // 4. Hedef tabloya ekle
      const cols = Object.keys(transferData);
      const placeholders = cols.map(() => '?').join(', ');
      const insertQuery = `INSERT INTO ${targetTable} (${cols.join(', ')}) VALUES (${placeholders})`;
      const insertResult = db.prepare(insertQuery).run(...Object.values(transferData));

      // 5. Kaynak tablodan sil
      db.prepare(`DELETE FROM ${sourceTable} WHERE id = ?`).run(id);

      return { newId: insertResult.lastInsertRowid, phone_no: row.phone_no };
    });

    const result = transaction();

    // 6. Log kaydı
    logActivity(req, 'TRANSFER', targetType.toUpperCase(), result.newId, { 
      fromType: currentType, 
      toType: targetType, 
      phone_no: result.phone_no,
      originalId: id 
    });

    res.json({ 
      success: true, 
      message: `SIM kart başarıyla ${targetType.toUpperCase()} hattına dönüştürüldü.`,
      newId: result.newId
    });

  } catch (err) {
    console.error('Transfer Error:', err);
    res.status(500).json({ message: `Dönüştürme işlemi başarısız: ${err.message}` });
  }
});

module.exports = router;
