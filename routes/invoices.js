const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../database/db');
const { authMiddleware, canView, canEdit } = require('../middleware/auth');

// Import new services
const { parseInvoicePDF } = require('../services/invoiceParser');
const { parseInvoiceXML } = require('../services/ublParser'); // Yeni XML Parser
const { findPersonnelByPhone, normalizePhone } = require('../services/invoiceMatcher');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

// GET /api/invoices/summary - Get summary of all independent invoices by period, operator, and file
router.get('/summary', canView('invoices'), (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT period, 
             operator, 
             COALESCE(source_file, 'Bilinmeyen Dosya') as source_file,
             COUNT(*) as ticket_count, 
             SUM(amount) as total_amount, 
             SUM(tax_kdv) as total_kdv,
             SUM(tax_oiv) as total_oiv,
             SUM(total_amount) as total_payable,
             SUM(CASE WHEN is_matched = 0 THEN 1 ELSE 0 END) as unmatched_count
      FROM invoices 
      GROUP BY period, operator, COALESCE(source_file, 'Bilinmeyen Dosya')
      ORDER BY period DESC, operator ASC, source_file ASC
    `).all();

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Özet getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/invoices/list - Get detailed list
router.get('/list', canView('invoices'), (req, res) => {
  try {
    const data = fetchInvoices({
      period: req.query.period,
      operator: req.query.operator,
      sourceFile: req.query.source_file,
      isMatched: req.query.is_matched,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Fatura listesi getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/invoices/export - Download invoice list as Excel
router.get('/export', canView('invoices'), (req, res) => {
  try {
    const data = fetchInvoices({
      period: req.query.period,
      operator: req.query.operator,
      sourceFile: req.query.source_file,
    });

    if (!data.length) {
      return res.status(404).json({ message: 'İndirilecek fatura bulunamadı.' });
    }

    const header = ['Dönem', 'Operatör', 'Dosya/Hesap', 'Şirket', 'Personel', 'Masraf Kalemi', 'Telefon', 'Tarife', 'Fatura Tutarı', 'KDV', 'ÖİV', 'Ödenecek Tutar', 'Eşleşme Durumu'];
    const rows = data.map(row => [
      row.period,
      row.operator,
      row.source_file || '',
      row.company_name || '',
      row.personnel_name || '',
      row.cost_center || '',
      row.phone_no || '',
      row.tariff || '',
      row.amount || 0,
      row.tax_kdv || 0,
      row.tax_oiv || 0,
      row.total_amount || 0,
      row.is_matched ? 'Sistemde Kayıtlı' : 'KAYITLI DEĞİL'
    ]);

    const worksheet = xlsx.utils.aoa_to_sheet([header, ...rows]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Faturalar');
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const safePart = (val) => (val || 'tum').toString().replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `faturalar-${safePart(req.query.period)}-${safePart(req.query.source_file)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Excel hazırlanırken hata oluştu', error: error.message });
  }
});

// GET /api/invoices/history/:phoneNo - Get historical invoice data
router.get('/history/:phoneNo', canView('invoices'), (req, res) => {
  try {
    const { phoneNo } = req.params;
    const cleanPhone = normalizePhone(phoneNo);
    
    const history = db.prepare(`
      SELECT period, operator, source_file, personnel_name, company_name, cost_center, tariff, total_amount, is_matched
      FROM invoices 
      WHERE phone_no = ? OR phone_no = ? 
      ORDER BY period DESC
    `).all(cleanPhone, cleanPhone.substring(1));

    const currentAssignment = findPersonnelByPhone(cleanPhone);

    res.json({
      phone_no: cleanPhone,
      current_assignment: currentAssignment,
      history
    });
  } catch (error) {
    res.status(500).json({ message: 'Geçmiş verisi getirilirken hata oluştu', error: error.message });
  }
});

// POST /api/invoices/bulk-delete - Delete multiple invoice IDs
router.post('/bulk-delete', canEdit('invoices'), (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'Silinecek ID listesi boş.' });

    const info = db.transaction(() => {
      const stmt = db.prepare('DELETE FROM invoices WHERE id = ?');
      let count = 0;
      for (const id of ids) {
        count += stmt.run(id).changes;
      }
      return { changes: count };
    })();

    db.prepare(`INSERT INTO activity_logs (user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, req.user.username, 'bulk_delete_invoices', 'invoices',
      `${info.changes} adet fatura kaydı toplu olarak silindi.`
    );

    res.json({ message: 'Seçili faturalar başarıyla silindi', deletedCount: info.changes });
  } catch (error) {
    res.status(500).json({ message: 'Toplu silme hatası', error: error.message });
  }
});

// POST /api/invoices/bulk-edit - Edit multiple invoice IDs
router.post('/bulk-edit', canEdit('invoices'), (req, res) => {
  try {
    const { ids, personnel_name, cost_center } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ message: 'Düzenlenecek ID listesi boş.' });

    const info = db.transaction(() => {
      const updates = [];
      const params = [];
      if (personnel_name !== undefined) {
        updates.push('personnel_name = ?');
        params.push(personnel_name);
      }
      if (cost_center !== undefined) {
        updates.push('cost_center = ?');
        params.push(cost_center);
      }
      if (updates.length === 0) return { changes: 0 };
      
      const sql = `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`;
      const stmt = db.prepare(sql);
      let count = 0;
      for (const id of ids) {
        count += stmt.run(...params, id).changes;
      }
      return { changes: count };
    })();

    res.json({ message: 'Seçili faturalar başarıyla güncellendi', updatedCount: info.changes });
  } catch (error) {
    res.status(500).json({ message: 'Toplu düzenleme hatası', error: error.message });
  }
});


// POST /api/invoices/bulk-delete-summaries - Delete entire independent files (Period + Source File)
router.post('/bulk-delete-summaries', canEdit('invoices'), (req, res) => {
  try {
    const { summaries } = req.body; // Array of { period, operator, source_file }
    if (!summaries || !summaries.length) return res.status(400).json({ message: 'Silinecek liste boş.' });

    const info = db.transaction(() => {
      const stmtGroup = db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ? AND source_file = ?');
      let count = 0;
      for (const s of summaries) {
        if (s.source_file) {
          count += stmtGroup.run(s.period, s.operator, s.source_file).changes;
        }
      }
      return { changes: count };
    })();

    res.json({ message: 'Seçili belge/faturalar başarıyla silindi', deletedCount: info.changes });
  } catch (error) {
    res.status(500).json({ message: 'Belge silme hatası', error: error.message });
  }
});

function fetchInvoices({ period, operator, sourceFile, isMatched } = {}) {
  let query = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];

  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }
  if (operator) {
    query += ' AND operator = ?';
    params.push(operator);
  }
  if (sourceFile) {
    query += ' AND source_file = ?';
    params.push(sourceFile);
  }
  if (isMatched !== undefined && isMatched !== '') {
    query += ' AND is_matched = ?';
    params.push(isMatched === 'true' || isMatched === '1' ? 1 : 0);
  }

  query += ' ORDER BY total_amount DESC';

  const list = db.prepare(query).all(...params);
  const updateStmt = db.prepare('UPDATE invoices SET personnel_name = ?, cost_center = ?, company_name = ?, tariff = ?, is_matched = ? WHERE id = ?');

  return list.map(row => {
    if (row.phone_no) {
      const { name, costCenter, company, tariff, isMatched: newlyMatched } = findPersonnelByPhone(row.phone_no);
      let changed = false;

      // 1. Tarife daima SIM karttan gelmeli (Faturadaki PDF ayrıştırmasını eziyoruz)
      if (newlyMatched && row.tariff !== tariff) {
        row.tariff = tariff;
        changed = true;
      } else if (!newlyMatched && row.tariff !== '') {
        // Eşleşmiyorsa hatalı PDF metnini temizle
        row.tariff = '';
        changed = true;
      }

      // 2. Kişi, Masraf ve Şirket verilerini daima SIM karttan yansıt
      if (newlyMatched) {
        if (row.personnel_name !== name) {
          row.personnel_name = name;
          changed = true;
        }
        if (row.cost_center !== costCenter) {
          row.cost_center = costCenter;
          changed = true;
        }
        if (row.company_name !== company) {
          row.company_name = company;
          changed = true;
        }
      } else {
        // Eşleşmiyorsa eski verileri de temizle
        if (row.personnel_name) { row.personnel_name = ''; changed = true; }
        if (row.cost_center) { row.cost_center = ''; changed = true; }
        if (row.company_name) { row.company_name = ''; changed = true; }
      }

      // 3. Eşleşme durumu
      const matchStatus = newlyMatched ? 1 : 0;
      if (row.is_matched !== matchStatus) {
        row.is_matched = matchStatus;
        changed = true;
      }

      if (changed) {
        updateStmt.run(row.personnel_name || null, row.cost_center || null, row.company_name || null, row.tariff || '', row.is_matched, row.id);
      }
    }
    return row;
  });
}

// POST /api/invoices/upload - Upload and parse file independent
router.post('/upload', canEdit('invoices'), upload.array('file'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Dosya yüklenmedi.' });
    
    // Yükleme ekranından dönemi alıyoruz. Artık her dosya bağımsız. 
    // Operatör kısmı, sistem veya dosya isminden de okunabilir, ama şimdilik "operator" parametresini de isteyebiliriz veya "Turkcell" varsayabiliriz.
    const { period } = req.body;
    let fallbackOperator = req.body.operator || 'Bilinmeyen Operatör';
    if (!period) {
      return res.status(400).json({ message: 'Dönem seçimi zorunludur.' });
    }

    let insertCount = 0;
    const debugInfo = [];

    for (const file of req.files) {
      const originalName = file.originalname;
      
      const isPDF = originalName.toLowerCase().endsWith('.pdf');
      const isXML = originalName.toLowerCase().endsWith('.xml');

      if (!isPDF && !isXML) {
        console.warn(`[Upload] Sadece PDF ve XML desteklenir: ${originalName}`);
        continue;
      }

      // If user provided an operator in dropdown, use it. Otherwise guess from filename.
      let operator = fallbackOperator;
      if (originalName.toLowerCase().includes('vodafone')) operator = 'Vodafone';
      if (originalName.toLowerCase().includes('turkcell')) operator = 'Turkcell';

      try {
        let extractedRecords = [];
        if (isPDF) {
          extractedRecords = await parseInvoicePDF(file.buffer);
        } else if (isXML) {
          extractedRecords = await parseInvoiceXML(file.buffer);
        }

        if (!extractedRecords.length) {
          debugInfo.push({ file: originalName, error: 'Ayrıştırılabilen kayıt bulunamadı.' });
          continue;
        }

        // We delete only if a file WITH THE EXACT SAME NAME was uploaded for THIS PERIOD. 
        // So a file explicitly replaces its older self, but not other files.
        db.transaction(() => {
          db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ? AND source_file = ?').run(period, operator, originalName);

          const insertStmt = db.prepare(`
            INSERT INTO invoices (operator, period, phone_no, personnel_name, cost_center, tariff, amount, tax_kdv, tax_oiv, total_amount, company_name, source_file, is_matched)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const rec of extractedRecords) {
            // Eşleşme kontrolü (Akıllı eşleşme motoru)
            const { name: dbName, costCenter: dbCostCenter, company: dbCompany, tariff: dbTariff, isMatched } = findPersonnelByPhone(rec.phoneNo);

            insertStmt.run(
              operator, 
              period, 
              rec.phoneNo, 
              dbName || '', 
              dbCostCenter || '', 
              dbTariff || '',
              rec.amount, 
              rec.tax_kdv, 
              rec.tax_oiv, 
              rec.total_amount, 
              dbCompany || '', 
              originalName, 
              isMatched ? 1 : 0
            );
            insertCount++;
          }
        })();
      } catch (fileErr) {
        console.error(`[Fatura] ${originalName} dosyasında hata:`, fileErr);
      }
    }

    if (insertCount === 0) {
      return res.status(400).json({ message: 'Geçerli veri çıkartılamadı.', debug: debugInfo });
    }
    
    db.prepare(`INSERT INTO activity_logs (user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, req.user.username, 'upload_invoices', 'invoices',
      `${period} dönemine ${req.files.length} bağımsız dosya eklendi, ${insertCount} tutar kaydı oluşturuldu.`
    );

    res.json({ message: `${req.files.length} dosyadan ${insertCount} fatura kaydı başarıyla eklendi.` });

  } catch (error) {
    console.error('Invoice Batch Upload Error:', error);
    res.status(500).json({ message: 'Dosyalar işlenirken kritik hata oluştu', error: error.message });
  }
});

module.exports = router;
