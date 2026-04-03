const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const pdfParse = require('pdf-parse');
const cheerio = require('cheerio');
const db = require('../database/db');
const { authMiddleware, canView, canEdit } = require('../middleware/auth');

// Setup multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authMiddleware);

// GET /api/invoices/summary - Get summary of all invoices grouped by period and operator
router.get('/summary', canView('invoices'), (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT period, operator, company_name,
             COUNT(*) as ticket_count, 
             SUM(amount) as total_amount, 
             SUM(tax_kdv) as total_kdv,
             SUM(tax_oiv) as total_oiv,
             SUM(total_amount) as total_payable
      FROM invoices 
      GROUP BY period, operator, company_name 
      ORDER BY period DESC, operator ASC, company_name ASC
    `).all();

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Özet getirilirken hata oluştu', error: error.message });
  }
});

// GET /api/invoices/list - Get detailed list for a specific period and operator
router.get('/list', canView('invoices'), (req, res) => {
  try {
    const data = fetchInvoices({
      period: req.query.period,
      operator: req.query.operator,
      companyName: req.query.company_name,
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
      companyName: req.query.company_name,
    });

    if (!data.length) {
      return res.status(404).json({ message: 'İndirilecek fatura bulunamadı.' });
    }

    const header = ['Dönem', 'Operatör', 'Şirket', 'Personel', 'Masraf Kalemi', 'Telefon', 'Tarife', 'Fatura Tutarı', 'KDV', 'ÖİV', 'Ödenecek Tutar'];
    const rows = data.map(row => [
      row.period,
      row.operator,
      row.company_name || '',
      row.personnel_name || '',
      row.cost_center || '',
      row.phone_no || '',
      row.tariff || '',
      row.amount || 0,
      row.tax_kdv || 0,
      row.tax_oiv || 0,
      row.total_amount || 0,
    ]);

    const worksheet = xlsx.utils.aoa_to_sheet([header, ...rows]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Faturalar');
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const safePart = (val) => (val || 'tum').toString().replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `faturalar-${safePart(req.query.period)}-${safePart(req.query.operator)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Excel hazırlanırken hata oluştu', error: error.message });
  }
});

// DELETE /api/invoices/:period/:operator - Delete uploaded invoices for a specific period & operator
router.delete('/:period/:operator', canEdit('invoices'), (req, res) => {
  try {
    const { period, operator } = req.params;
    const { company_name } = req.query;
    let stmt, info;
    if (company_name) {
      stmt = db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ? AND company_name = ?');
      info = stmt.run(period, operator, company_name);
    } else {
      stmt = db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ?');
      info = stmt.run(period, operator);
    }
    
    // Log the action
    db.prepare(`INSERT INTO activity_logs (user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, req.user.username, 'delete_invoices', 'invoices',
      `${period} dönemi ${operator}${company_name ? ' / ' + company_name : ''} faturaları silindi (${info.changes} kayıt)`
    );

    res.json({ message: 'Faturalar başarıyla silindi', deletedCount: info.changes });
  } catch (error) {
    res.status(500).json({ message: 'Faturalar silinirken hata oluştu', error: error.message });
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
        const result = stmt.run(id);
        count += result.changes;
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
        const result = stmt.run(...params, id);
        count += result.changes;
      }
      return { changes: count };
    })();

    db.prepare(`INSERT INTO activity_logs (user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, req.user.username, 'bulk_edit_invoices', 'invoices',
      `${info.changes} adet fatura kaydı toplu olarak güncellendi.`
    );

    res.json({ message: 'Seçili faturalar başarıyla güncellendi', updatedCount: info.changes });
  } catch (error) {
    res.status(500).json({ message: 'Toplu düzenleme hatası', error: error.message });
  }
});


// POST /api/invoices/bulk-delete-summaries - Delete multiple invoice summaries (period, operator, company)
router.post('/bulk-delete-summaries', canEdit('invoices'), (req, res) => {
  try {
    const { summaries } = req.body; // Array of { period, operator, company_name }
    if (!summaries || !summaries.length) return res.status(400).json({ message: 'Silinecek özet listesi boş.' });

    const info = db.transaction(() => {
      const stmtGroup = db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ? AND company_name = ?');
      const stmtNoCompany = db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ? AND (company_name IS NULL OR company_name = \'\')');
      let count = 0;
      for (const s of summaries) {
        if (s.company_name) {
          count += stmtGroup.run(s.period, s.operator, s.company_name).changes;
        } else {
          count += stmtNoCompany.run(s.period, s.operator).changes;
        }
      }
      return { changes: count };
    })();

    db.prepare(`INSERT INTO activity_logs (user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, req.user.username, 'bulk_delete_summaries', 'invoices',
      `${summaries.length} adet fatura özeti (${info.changes} kayıt) toplu olarak silindi.`
    );

    res.json({ message: 'Seçili fatura özetleri başarıyla silindi', deletedCount: info.changes });
  } catch (error) {
    res.status(500).json({ message: 'Toplu özet silme hatası', error: error.message });
  }
});


// Helper function to find a column index based on keywords
function findColumnIndex(headers, keywords) {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toString().toLowerCase().trim();
    if (keywords.some(kw => h.includes(kw))) {
      return i;
    }
  }
  return -1;
}

function parseAmount(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  let str = val.toString().trim().replace(/[^0-9.,-]/g, '');
  if (!str) return 0;

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    // Both separators: whichever comes LAST is the decimal separator
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastDot > lastComma) {
      // e.g. 1,234.56 (US format) → remove commas
      str = str.replace(/,/g, '');
    } else {
      // e.g. 1.234,56 (Turkish format) → remove dots, replace comma
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    // Only comma: e.g. 123,45 → treat as decimal
    const parts = str.split(',');
    str = (parts.length === 2 && parts[1].length <= 2)
      ? str.replace(',', '.') // decimal comma
      : str.replace(/,/g, ''); // thousands comma
  } else if (hasDot) {
    // Only dot: e.g. 108.46 → decimal OR 1.234 → thousands
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // e.g. 108.46 or 823.2 → keep as decimal
    } else {
      // e.g. 1.234 or 1.234.567 → thousands separator, remove
      str = str.replace(/\./g, '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

const normalizePhone = (value) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(-10);
};

const sanitizePhoneSQL = (column) => `substr(replace(replace(replace(replace(replace(COALESCE(${column}, ''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), -10)`;
const PERSONNEL_PHONE_EXPR = sanitizePhoneSQL('phone');
const VOICE_PHONE_EXPR = sanitizePhoneSQL('phone_no');
const M2M_PHONE_EXPR = sanitizePhoneSQL('phone_no');
const DATA_PHONE_EXPR = sanitizePhoneSQL('phone_no');


function findPersonnelByPhone(phoneNo) {
  const cleanPhone = normalizePhone(phoneNo);
  if (!cleanPhone) return { name: '', costCenter: '', company: '' };
  try {
    // 1. Önce doğrudan personeller tablosunda bu telefonu ara
    let res = db.prepare(`SELECT first_name || ' ' || last_name as name, cost_center, company FROM personnel WHERE ${PERSONNEL_PHONE_EXPR} = ? LIMIT 1`).get(cleanPhone);
    if (res && res.name) return { name: res.name, costCenter: res.cost_center || '', company: res.company || '' };

    // 2. Ses hatları tablosunda ara (atanmış bir personel var mı?)
    // Ayrıca sim_voice tablosuna cost_center eklendiyse onu da kontrol et
    res = db.prepare(`
      SELECT assigned_to as name, department, assigned_company 
      FROM sim_voice 
      WHERE ${VOICE_PHONE_EXPR} = ? LIMIT 1
    `).get(cleanPhone);

    if (res && res.name) {
      // Bulunan isme göre masraf kalemini personellerden bulmaya çalış
      // SADECE GÜVENLİ ARAMA: first_name ve last_name boşluklarla birleştirilerek tam eşleşme
      const p = db.prepare(`SELECT cost_center, company FROM personnel WHERE (first_name || ' ' || last_name) = ? OR first_name = ? OR last_name = ? LIMIT 1`).get(res.name, res.name, res.name);
      return {
        name: res.name,
        costCenter: res.department || (p ? (p.cost_center || '') : ''),
        company: res.assigned_company || (p ? (p.company || '') : '')
      };
    }

    // 3. M2M veya Data hatlarında ara (Araç plakası veya lokasyon bilgisi için)
    res = db.prepare(`SELECT plate_no as name FROM sim_m2m WHERE ${M2M_PHONE_EXPR} = ? LIMIT 1`).get(cleanPhone);
    if (res && res.name) return { name: res.name + ' (PLAKA)', costCenter: 'LOJİSTİK', company: '' };

    res = db.prepare(`SELECT location as name FROM sim_data WHERE ${DATA_PHONE_EXPR} = ? LIMIT 1`).get(cleanPhone);
    if (res && res.name) return { name: res.name + ' (LOKASYON)', costCenter: '', company: '' };

    return { name: '', costCenter: '', company: '' };
  } catch (e) {
    console.error('Lookup Error:', e);
    return { name: '', costCenter: '', company: '' };
  }
}

function fetchInvoices({ period, operator, companyName } = {}) {
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
  if (companyName) {
    query += ' AND company_name = ?';
    params.push(companyName);
  }

  query += ' ORDER BY total_amount DESC';

  const list = db.prepare(query).all(...params);
  const updateStmt = db.prepare('UPDATE invoices SET personnel_name = ?, cost_center = ?, company_name = ? WHERE id = ?');

  return list.map(row => {
    if (row.phone_no && (!row.personnel_name || !row.cost_center || !row.company_name)) {
      const { name, costCenter, company } = findPersonnelByPhone(row.phone_no);
      let changed = false;
      if (!row.personnel_name && name) {
        row.personnel_name = name;
        changed = true;
      }
      if (!row.cost_center && costCenter) {
        row.cost_center = costCenter;
        changed = true;
      }
      if (!row.company_name && company) {
        row.company_name = company;
        changed = true;
      }
      if (changed) {
        updateStmt.run(row.personnel_name || null, row.cost_center || null, row.company_name || null, row.id);
      }
    }
    return row;
  });
}

// POST /api/invoices/upload - Upload and parse file (Excel, XML, HTML, PDF)
router.post('/upload', canEdit('invoices'), upload.array('file'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'Dosya yüklenmedi.' });
    
    const { period, operator } = req.body;
    if (!period || !operator) {
      return res.status(400).json({ message: 'Dönem ve Operatör seçimi zorunludur.' });
    }

    // We already have pdfParse required at the top
    let insertCount = 0;

    for (const file of req.files) {
      const records = [];
      // Derive company name from filename (strip extension)
      const companyName = file.originalname.replace(/\.[^.]+$/, '').trim();
      try {
        const originalName = file.originalname.toLowerCase();
        const isXML = originalName.endsWith('.xml') || originalName.endsWith('.html');
        const isPDF = originalName.endsWith('.pdf');

        if (isXML) {
          const content = file.buffer.toString('utf-8');
          const regex = /F2-([0-9]{10,12})\?(.*?)#([\d.,-]+)\$([\d.,-]+)\+([\d.,-]+)!([\d.,-]+)/g;
          let match;
          while ((match = regex.exec(content)) !== null) {
            const phoneNo = match[1];
            let { name: dbName, costCenter: dbCostCenter } = findPersonnelByPhone(phoneNo);
            const filePerson = 'XML-Personel'; 

            records.push({ 
              phoneNo, 
              personnelName: dbName || filePerson, 
              costCenter: dbCostCenter || '',
              tariff: match[2], 
              amount: parseAmount(match[3]), 
              tax_kdv: parseAmount(match[5]), 
              tax_oiv: parseAmount(match[6]), 
              total_amount: parseAmount(match[4]) 
            });
          }
          
          if (records.length === 0 && originalName.endsWith('.html')) {
            const $ = cheerio.load(content);
            $('tr').each((i, row) => {
              const rowCols = $(row).find('td').map((i, td) => $(td).text().trim()).get();
              if (rowCols && rowCols.length >= 4) {
                const combined = rowCols.join(' ').toLowerCase();
                if (combined.includes('gsm') || combined.includes('telefon') || combined.includes('tarih')) return;
                const phoneStr = rowCols.find(c => c && c.replace(/\s/g,'').startsWith('5') && c.replace(/\s/g,'').length >= 10);
                 if (phoneStr) {
                    const phoneNo = phoneStr.replace(/[^0-9]/g, '').slice(-10);
                    let { name: dbName, costCenter: dbCostCenter } = findPersonnelByPhone(phoneNo);
                    
                    // Fallback to name search if missing cost center
                    const filePerson = rowCols[colPerson] || ''; // If HTML parsing had colPerson, but HTML is tricky. Usually name is nearby.
                    
                    records.push({ 
                      phoneNo, 
                      personnelName: dbName || '', 
                      costCenter: dbCostCenter || '',
                      tariff: 'HTML Tablo', 
                      amount: parseAmount(rowCols[rowCols.length-3]), 
                      tax_kdv: parseAmount(rowCols[rowCols.length-2]), 
                      tax_oiv: 0, 
                      total_amount: parseAmount(rowCols[rowCols.length-1]) 
                    });
                 }
              }
            });
          }
        } else if (isPDF) {
          const pdfResult = await pdfParse(file.buffer);

          if (pdfResult && pdfResult.text) {
            const lines = pdfResult.text.split('\n');
            let isTableSection = false;
            
            for (const line of lines) {
              const cleanLine = line.trim();
              
              // Start marker for charges table (Flexible: can be split across lines)
              if ((cleanLine.includes('GSM') && cleanLine.includes('TARİFE')) || cleanLine.includes('FATURA ÜCRET DETAYLARI')) {
                isTableSection = true;
                continue;
              }

              
              // Stop marker for commitment/footer info
              if (cleanLine.includes('TAAHHÜT BİLGİLERİ') || cleanLine.includes('TOPLAMI')) {
                if (isTableSection) isTableSection = false;
              }

              if (!isTableSection) continue;

              const phoneMatch = cleanLine.match(/5\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/);
              if (phoneMatch) {
                const phoneNo = phoneMatch[0].replace(/\D/g, '');
                const parts = cleanLine.split(/\s+/).map(p => p.trim());
                
                // Find where the numbers likely start (after phone and tariff name)
                // Usually phone is the first part, tariff is second/third.
                // We'll filter the parts that look like numbers and are not the phone number.
                const nums = parts.filter(p => {
                  if (p === phoneMatch[0] || p.replace(/\D/g, '') === phoneNo) return false;
                  // Skip dates
                  if (/^\d{2}\.\d{2}\.\d{4}$/.test(p)) return false;
                  // Skip anything that's not numeric-ish
                  if (!/^[0-9.,-]+$/.test(p)) return false;
                  // It's a number, check if it's a valid amount
                  const val = parseAmount(p);
                  return !isNaN(val) && p.length > 0;
                });
                
                if (nums.length >= 2) {
                  // Usually: Fatura Tutarı, Ödenecek Tutar, KDV, ÖİV
                  const total_amount = parseAmount(nums[1] || nums[0]); // Ödenecek Tutar is usually 2nd num
                  const amount = parseAmount(nums[0]);
                  const tax_kdv = nums.length >= 3 ? parseAmount(nums[2]) : (total_amount - amount) * 0.7; 
                  const tax_oiv = nums.length >= 4 ? parseAmount(nums[3]) : (total_amount - amount) * 0.3;

                  let { name: dbName, costCenter: dbCostCenter } = findPersonnelByPhone(phoneNo);
                  
                  // Try to find cost center from the name we just extracted if possible
                  // In PDF we rarely get explicit name, but if we do later we can update.
                  
                  records.push({ 
                    phoneNo, 
                    personnelName: dbName || '', 
                    costCenter: dbCostCenter || '',
                    tariff: 'PDF Analiz', 
                    amount, tax_kdv, tax_oiv, total_amount,
                    companyName
                  });
                }
              }

            }
          }
        } else {
          try {
            const workbook = xlsx.read(file.buffer, { type: 'buffer' });
            let targetSheet;
            for (const sheetName of workbook.SheetNames) {
              const firstRow = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })[0] || [];
              const rowStr = firstRow.join(' ').toLowerCase();
              if (rowStr.includes('gsm') || rowStr.includes('tutar') || rowStr.includes('ödenecek')) {
                targetSheet = workbook.Sheets[sheetName];
                break;
              }
            }
            if (!targetSheet) targetSheet = workbook.Sheets[workbook.SheetNames[0]];

            const rawData = xlsx.utils.sheet_to_json(targetSheet, { header: 1 });
            if (rawData.length < 2) continue;

            let headerRowIdx = -1;
            for(let i=0; i<Math.min(10, rawData.length); i++) {
                const combined = (rawData[i] || []).join(' ').toLowerCase();
                if(combined.includes('gsm') || combined.includes('telefon') || combined.includes('personel') || combined.includes('tutar')) {
                    headerRowIdx = i; break;
                }
            }
            if (headerRowIdx === -1) headerRowIdx = 0;

            const headers = rawData[headerRowIdx];
            if (!headers || !Array.isArray(headers)) continue;

            const colPhone = findColumnIndex(headers, ['gsm', 'telefon', 'msisdn', 'no']);
            const colPerson = findColumnIndex(headers, ['personel', 'kullanıcı', 'ad soyad', 'isim']);
            const colTariff = findColumnIndex(headers, ['tarife', 'paket']);
            const colTotalAmount = findColumnIndex(headers, ['ödenecek', 'toplam', 'net tutar']);
            const colAmount = findColumnIndex(headers, ['fatura tutarı', 'tutar']); 
            const colKDV = findColumnIndex(headers, ['kdv']);
            const colOIV = findColumnIndex(headers, ['öiv', 'oiv']);
            const finalColTotalAmount = colTotalAmount !== -1 ? colTotalAmount : colAmount;

            if (colPhone === -1) continue;

            for (let j = headerRowIdx + 1; j < rawData.length; j++) {
              const row = rawData[j];
              if (!row || !row[colPhone]) continue;
              const phoneNo = String(row[colPhone]).trim().replace(/\D/g, '').slice(-10);
              if(!phoneNo || isNaN(phoneNo)) continue;

              let { name: dbName, costCenter: dbCostCenter } = findPersonnelByPhone(phoneNo);
              const filePerson = colPerson !== -1 ? String(row[colPerson] || '').trim() : '';

              if (!dbCostCenter && filePerson) {
                // Eşleşme bulamadık ama Excel'de bir isim var, bu isimle personellerde ara
                const p = db.prepare(`SELECT cost_center FROM personnel WHERE (first_name || ' ' || last_name) LIKE '%' || ? || '%' LIMIT 1`).get(filePerson.replace(/\s+/g, '%'));
                if (p && p.cost_center) dbCostCenter = p.cost_center;
              }

              const amount = colAmount !== -1 ? parseAmount(row[colAmount]) : 0;
              const tax_kdv = colKDV !== -1 ? parseAmount(row[colKDV]) : 0;
              const tax_oiv = colOIV !== -1 ? parseAmount(row[colOIV]) : 0;
              let total_amount = finalColTotalAmount !== -1 ? parseAmount(row[finalColTotalAmount]) : 0;
              if (total_amount === 0 && amount !== 0) total_amount = amount + tax_kdv + tax_oiv;

              records.push({ 
                phoneNo, 
                personnelName: dbName || filePerson, 
                costCenter: dbCostCenter || '',
                tariff: colTariff !== -1 ? String(row[colTariff] || '').trim() : '', 
                amount, tax_kdv, tax_oiv, total_amount,
                companyName
              });
            }
          } catch (excelErr) {
            console.error(`[Excel] ${file.originalname} işlenemedi:`, excelErr.message);
          }
        }
      } catch (fileErr) {
        console.error(`[Fatura] ${file.originalname} dosyasında hata:`, fileErr);
      }

      // Insert this file's records into DB immediately (per-file transaction)
      if (records.length > 0) {
        db.transaction(() => {
          // Clear existing records for this period, operator AND company
          db.prepare('DELETE FROM invoices WHERE period = ? AND operator = ? AND company_name = ?').run(period, operator, companyName);

          const insertStmt = db.prepare(`
            INSERT INTO invoices (operator, period, phone_no, personnel_name, cost_center, tariff, amount, tax_kdv, tax_oiv, total_amount, company_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const rec of records) {
            insertStmt.run(
              operator, period, rec.phoneNo, rec.personnelName, rec.costCenter || '', rec.tariff,
              rec.amount, rec.tax_kdv, rec.tax_oiv, rec.total_amount, companyName
            );
            insertCount++;
          }
        })();
        console.log(`[Upload] ${file.originalname} → ${records.length} kayıt eklendi (${companyName})`);
      } else {
        console.warn(`[Upload] ${file.originalname} → geçerli veri bulunamadı`);
      }
    }

    if (insertCount === 0) {
      return res.status(400).json({ message: 'Seçilen dosyalardan geçerli veri çıkartılamadı.' });
    }
    
    db.prepare(`INSERT INTO activity_logs (user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?)`).run(
      req.user.id, req.user.username, 'upload_invoices', 'invoices',
      `${period} dönemi ${operator} faturaları yüklendi (${req.files.length} dosya, ${insertCount} kayıt)`
    );

    if (insertCount === 0) {
      return res.status(400).json({ message: 'Seçilen dosyalardan geçerli veri çıkartılamadı.' });
    }
    res.json({ message: `${req.files.length} dosyadan ${insertCount} fatura kaydı başarıyla aktarıldı.` });

  } catch (error) {
    console.error('Invoice Batch Upload Error:', error);
    res.status(500).json({ message: 'Dosyalar işlenirken kritik hata oluştu', error: error.message });
  }
});


module.exports = router;
