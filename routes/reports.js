const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/reports/advanced
router.post('/advanced', (req, res) => {
  const { startDate, endDate, operator, status } = req.body;
  
  let qM2m = 'SELECT * FROM sim_m2m WHERE 1=1';
  let qData = 'SELECT * FROM sim_data WHERE 1=1';
  let qVoice = 'SELECT * FROM sim_voice WHERE 1=1';
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
    qM2m += ` AND operator = '${operator}'`; qData += ` AND operator = '${operator}'`; qVoice += ` AND operator = '${operator}'`;
  }
  if (status) {
    qM2m += ` AND status = '${status}'`; qData += ` AND status = '${status}'`; qVoice += ` AND status = '${status}'`;
  }

  qM2m += ' ORDER BY created_at DESC';
  qData += ' ORDER BY created_at DESC';
  qVoice += ' ORDER BY created_at DESC';

  // For the parameters, we need to pass them to each query. SQLite prepare doesn't support array spread easily for 3 duplicated parameter sets in one go if they vary, but here the params are identical if we do them sequentially.
  
  // Extract params per query (since p has 3x duplicates, we just slice them or rebuild)
  const buildParams = () => {
    let cp = [];
    if (startDate) cp.push(startDate + ' 00:00:00');
    if (endDate) cp.push(endDate + ' 23:59:59');
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

  res.json({
    summary: {
      totals: { m2m: m2mTotal, data: dataTotal, voice: voiceTotal, all: m2mTotal + dataTotal + voiceTotal },
      byOperator: { m2m: formatGroup(m2mByOp), data: formatGroup(dataByOp), voice: formatGroup(voiceByOp) },
      byStatus: { m2m: formatGroup(m2mByStatus), data: formatGroup(dataByStatus), voice: formatGroup(voiceByStatus) }
    },
    lists: { m2m: m2mList, data: dataList, voice: voiceList }
  });
});

module.exports = router;
