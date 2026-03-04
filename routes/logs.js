const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminOnly);

// GET /api/logs
router.get('/', (req, res) => {
  try {
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (req.query.search) {
      const s = `%${req.query.search}%`;
      query += ` AND (username LIKE ? OR module LIKE ? OR action LIKE ? OR target_id LIKE ? OR details LIKE ?)`;
      params.push(s, s, s, s, s);
    }

    if (req.query.user_id) {
      query += ' AND user_id = ?';
      params.push(req.query.user_id);
    }
    if (req.query.module) {
      query += ' AND module = ?';
      params.push(req.query.module);
    }
    if (req.query.action) {
      query += ' AND action = ?';
      params.push(req.query.action);
    }
    if (req.query.startDate) {
      query += ' AND created_at >= ?';
      params.push(req.query.startDate);
    }
    if (req.query.endDate) {
      query += ' AND created_at <= ?';
      params.push(req.query.endDate);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';
    
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Loglar getirilirken hata oluştu.', error: err.message });
  }
});

module.exports = router;
