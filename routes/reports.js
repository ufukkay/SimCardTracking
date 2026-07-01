const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { findPersonnelByPhone } = require('../services/invoiceMatcher');

router.use(authMiddleware);

// POST /api/reports/advanced
router.post('/advanced', (req, res) => {
  const { startDate, endDate, operator, status } = req.body;
  
  let qM2m = 'SELECT r.*, p.name as package_name FROM sim_m2m r LEFT JOIN packages p ON r.package_id = p.id WHERE 1=1';
  let qData = 'SELECT r.*, p.name as package_name FROM sim_data r LEFT JOIN packages p ON r.package_id = p.id WHERE 1=1';
  let qVoice = 'SELECT r.*, p.name as package_name FROM sim_voice r LEFT JOIN packages p ON r.package_id = p.id WHERE 1=1';
  const p = [];

  if (startDate) {
    qM2m += ' AND created_at >= ?'; qData += ' AND created_at >= ?'; qVoice += ' AND created_at >= ?';
    p.push(startDate + ' 00:00:00', startDate + ' 00:00:00', startDate + ' 00:00:00');
  }
  if (endDate) {
    qM2m += ' AND created_at <= ?'; qData += ' AND created_at <= ?'; qVoice += ' AND created_at <= ?';
    p.push(endDate + ' 23:59:59', endDate + ' 23:59:59', endDate + ' 23:59:59');
  }
  if (operator) {
    qM2m += ` AND r.operator = ?`; qData += ` AND r.operator = ?`; qVoice += ` AND r.operator = ?`;
  }
  if (status) {
    qM2m += ` AND r.status = ?`; qData += ` AND r.status = ?`; qVoice += ` AND r.status = ?`;
  }

  qM2m += ' ORDER BY r.created_at DESC';
  qData += ' ORDER BY r.created_at DESC';
  qVoice += ' ORDER BY r.created_at DESC';

  // Extract params per query
  const buildParams = () => {
    let cp = [];
    if (startDate) cp.push(startDate + ' 00:00:00');
    if (endDate) cp.push(endDate + ' 23:59:59');
    if (operator) cp.push(operator);
    if (status) cp.push(status);
    return cp;
  };
  const qParams = buildParams();

  const m2mList = db.prepare(qM2m).all(...qParams);
  const dataList = db.prepare(qData).all(...qParams);
  const voiceList = db.prepare(qVoice).all(...qParams);

  // Calculate Summaries dynamically
  const m2mTotal = m2mList.length;
  const dataTotal = dataList.length;
  const voiceTotal = voiceList.length;

  const m2mByOp = {}; const dataByOp = {}; const voiceByOp = {};
  const m2mByStatus = {}; const dataByStatus = {}; const voiceByStatus = {};

  m2mList.forEach(r => { m2mByOp[r.operator] = (m2mByOp[r.operator] || 0) + 1; m2mByStatus[r.status] = (m2mByStatus[r.status] || 0) + 1; });
  dataList.forEach(r => { dataByOp[r.operator] = (dataByOp[r.operator] || 0) + 1; dataByStatus[r.status] = (dataByStatus[r.status] || 0) + 1; });
  voiceList.forEach(r => { voiceByOp[r.operator] = (voiceByOp[r.operator] || 0) + 1; voiceByStatus[r.status] = (voiceByStatus[r.status] || 0) + 1; });

  const formatGroup = (obj) => Object.entries(obj).map(([k, v]) => ({ key: k, count: v }));

  // Package distribution — tüm tablolardaki paket kullanımını say
  const pkgRows = db.prepare(`
    SELECT p.id, p.name as package_name, p.type, o.name as operator_name,
           (
             (SELECT COUNT(*) FROM sim_m2m WHERE package_id = p.id) +
             (SELECT COUNT(*) FROM sim_data WHERE package_id = p.id) +
             (SELECT COUNT(*) FROM sim_voice WHERE package_id = p.id)
           ) as count
    FROM packages p
    LEFT JOIN operators o ON p.operator_id = o.id
    ORDER BY count DESC, p.name ASC
  `).all().filter(r => r.count > 0);

  res.json({
    summary: {
      totals: { m2m: m2mTotal, data: dataTotal, voice: voiceTotal, all: m2mTotal + dataTotal + voiceTotal },
      byOperator: { m2m: formatGroup(m2mByOp), data: formatGroup(dataByOp), voice: formatGroup(voiceByOp) },
      byStatus: { m2m: formatGroup(m2mByStatus), data: formatGroup(dataByStatus), voice: formatGroup(voiceByStatus) },
      byPackage: pkgRows
    },
    lists: { m2m: m2mList, data: dataList, voice: voiceList }
  });
});

// GET /api/reports/periods - Get all unique invoice periods
router.get('/periods', (req, res) => {
  try {
    const periods = db.prepare(`SELECT DISTINCT period FROM invoices ORDER BY period DESC`).all();
    res.json(periods.map(p => p.period));
  } catch (error) {
    res.status(500).json({ message: 'Dönemler listelenirken hata oluştu', error: error.message });
  }
});

// POST /api/reports/financial - Get advanced financial reports
router.post('/financial', (req, res) => {
  try {
    const { period, comparePeriod } = req.body;
    
    if (!period) {
      return res.status(400).json({ message: 'Dönem (period) parametresi zorunludur.' });
    }

    // Get 3 consecutive periods (the target and the 2 preceding periods in database)
    const allPeriods = db.prepare(`SELECT DISTINCT period FROM invoices ORDER BY period DESC`).all().map(p => p.period);
    const targetIdx = allPeriods.indexOf(period);
    let period1 = period;
    let period2 = null;
    let period3 = null;
    if (targetIdx >= 0) {
      if (targetIdx + 1 < allPeriods.length) period2 = allPeriods[targetIdx + 1];
      if (targetIdx + 2 < allPeriods.length) period3 = allPeriods[targetIdx + 2];
    }

    // --- GERÇEK ZAMANLI EŞLEŞTİRME (Canlı Veri İçin) ---
    // Rapor üretilmeden hemen önce, ilgili dönemlerin faturalarını güncel hat durumlarıyla yeniden eşleştir
    const periodsToMatch = [period, comparePeriod, period2, period3].filter(Boolean);
    const uniquePeriods = [...new Set(periodsToMatch)];
    
    if (uniquePeriods.length > 0) {
      const invoicesToRematch = db.prepare(`SELECT id, phone_no FROM invoices WHERE period IN (${uniquePeriods.map(() => '?').join(',')})`).all(...uniquePeriods);
      const updateStmt = db.prepare('UPDATE invoices SET personnel_name = ?, cost_center = ?, company_name = ?, tariff = ?, is_matched = ? WHERE id = ?');
      
      db.transaction(() => {
        for (const inv of invoicesToRematch) {
          if (!inv.phone_no) continue;
          const match = findPersonnelByPhone(inv.phone_no);
          if (match.isMatched) {
            updateStmt.run(match.name, match.costCenter, match.company, match.tariff, 1, inv.id);
          }
        }
      })();
    }
    // ---------------------------------------------------

    // 1. Target period stats
    const targetStats = db.prepare(`
      SELECT SUM(total_amount) as total_payable, 
             SUM(amount) as amount, 
             SUM(tax_kdv) as kdv, 
             SUM(tax_oiv) as oiv, 
             COUNT(DISTINCT phone_no) as phone_count 
      FROM invoices 
      WHERE period = ?
    `).get(period) || { total_payable: 0, amount: 0, kdv: 0, oiv: 0, phone_count: 0 };

    // 2. Compare period stats
    let compareStats = null;
    if (comparePeriod) {
      compareStats = db.prepare(`
        SELECT SUM(total_amount) as total_payable, 
               SUM(amount) as amount, 
               SUM(tax_kdv) as kdv, 
               SUM(tax_oiv) as oiv, 
               COUNT(DISTINCT phone_no) as phone_count 
        FROM invoices 
        WHERE period = ?
      `).get(comparePeriod) || { total_payable: 0, amount: 0, kdv: 0, oiv: 0, phone_count: 0 };
    }

    // 3. Personnel / Holder Invoice list
    const invoicesList = db.prepare(`
      SELECT COALESCE(NULLIF(personnel_name, ''), 'Atanmamış / Bilinmeyen') as holder,
             phone_no,
             operator,
             tariff,
             cost_center,
             company_name,
             SUM(total_amount) as total_payable,
             is_matched,
             COALESCE(
                 (SELECT 'Ses' FROM sim_voice v WHERE v.phone_no = invoices.phone_no AND v.phone_no != '' LIMIT 1),
                 (SELECT 'M2M' FROM sim_m2m m WHERE m.phone_no = invoices.phone_no AND m.phone_no != '' LIMIT 1),
                 (SELECT 'Data' FROM sim_data d WHERE d.phone_no = invoices.phone_no AND d.phone_no != '' LIMIT 1),
                 'Bilinmiyor'
             ) as line_type
      FROM invoices
      WHERE period = ?
      GROUP BY holder, phone_no, operator, tariff, cost_center, company_name
      ORDER BY total_payable DESC
    `).all(period);

    // 4. MoM comparison list (holder level)
    let comparisonList = [];
    if (comparePeriod) {
      comparisonList = db.prepare(`
        SELECT COALESCE(NULLIF(personnel_name, ''), 'Atanmamış / Bilinmeyen') as holder,
               phone_no,
               operator,
               SUM(CASE WHEN period = ? THEN total_amount ELSE 0 END) as target_amount,
               SUM(CASE WHEN period = ? THEN total_amount ELSE 0 END) as compare_amount
        FROM invoices
        WHERE period IN (?, ?)
        GROUP BY holder, phone_no, operator
        ORDER BY target_amount DESC
      `).all(period, comparePeriod, period, comparePeriod);
    }

    // 5. Line ownership list (Active lines distribution)
    const lineOwnership = db.prepare(`
      SELECT holder, type, status, COUNT(*) as count
      FROM (
        SELECT COALESCE(NULLIF(assigned_to, ''), 'Atanmamış') as holder, 'voice' as type, status FROM sim_voice
        UNION ALL
        SELECT COALESCE(NULLIF(plate_no, ''), 'Atanmamış') as holder, 'm2m' as type, status FROM sim_m2m
        UNION ALL
        SELECT COALESCE(NULLIF(location, ''), 'Atanmamış') as holder, 'data' as type, status FROM sim_data
      )
      GROUP BY holder, type, status
      ORDER BY count DESC
    `).all();

    // 6. Son 3 Aylık Karşılaştırmalı Rapor Verisi
    const threeMonthsList = db.prepare(`
      SELECT COALESCE(NULLIF(personnel_name, ''), 'Atanmamış / Bilinmeyen') as holder,
             phone_no,
             operator,
             cost_center,
             company_name,
             SUM(CASE WHEN period = ? THEN total_amount ELSE 0 END) as amount_p1,
             SUM(CASE WHEN period = ? THEN total_amount ELSE 0 END) as amount_p2,
             SUM(CASE WHEN period = ? THEN total_amount ELSE 0 END) as amount_p3
      FROM invoices
      WHERE period IN (?, ?, ?)
      GROUP BY holder, phone_no, operator, cost_center, company_name
      ORDER BY amount_p1 DESC
    `).all(
      period1, 
      period2 || '', 
      period3 || '', 
      period1, 
      period2 || '', 
      period3 || ''
    );

    res.json({
      targetStats,
      compareStats,
      invoicesList,
      comparisonList,
      lineOwnership,
      threeMonthsReport: {
        periods: [period1, period2, period3].filter(Boolean),
        list: threeMonthsList
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Finansal rapor üretilirken hata oluştu', error: error.message });
  }
});

module.exports = router;
