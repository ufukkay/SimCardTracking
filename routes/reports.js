const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/reports/summary
router.get('/summary', (req, res) => {
  const m2mTotal = db.prepare('SELECT COUNT(*) as count FROM sim_m2m').get().count;
  const dataTotal = db.prepare('SELECT COUNT(*) as count FROM sim_data').get().count;
  const voiceTotal = db.prepare('SELECT COUNT(*) as count FROM sim_voice').get().count;

  const m2mByOp = db.prepare("SELECT operator, COUNT(*) as count FROM sim_m2m GROUP BY operator").all();
  const dataByOp = db.prepare("SELECT operator, COUNT(*) as count FROM sim_data GROUP BY operator").all();
  const voiceByOp = db.prepare("SELECT operator, COUNT(*) as count FROM sim_voice GROUP BY operator").all();

  const m2mByStatus = db.prepare("SELECT status, COUNT(*) as count FROM sim_m2m GROUP BY status").all();
  const dataByStatus = db.prepare("SELECT status, COUNT(*) as count FROM sim_data GROUP BY status").all();
  const voiceByStatus = db.prepare("SELECT status, COUNT(*) as count FROM sim_voice GROUP BY status").all();

  res.json({
    totals: { m2m: m2mTotal, data: dataTotal, voice: voiceTotal, all: m2mTotal + dataTotal + voiceTotal },
    byOperator: { m2m: m2mByOp, data: dataByOp, voice: voiceByOp },
    byStatus: { m2m: m2mByStatus, data: dataByStatus, voice: voiceByStatus }
  });
});

// GET /api/reports/m2m — plaka bazlı
router.get('/m2m', (req, res) => {
  res.json(db.prepare('SELECT plate_no, phone_no, iccid, operator, status, notes FROM sim_m2m ORDER BY plate_no').all());
});

// GET /api/reports/data — lokasyon bazlı
router.get('/data', (req, res) => {
  res.json(db.prepare('SELECT location, phone_no, iccid, operator, status, notes FROM sim_data ORDER BY location').all());
});

// GET /api/reports/voice — personel bazlı
router.get('/voice', (req, res) => {
  res.json(db.prepare('SELECT assigned_to, department, assigned_company, phone_no, iccid, operator, status FROM sim_voice ORDER BY assigned_to').all());
});

module.exports = router;
