const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminOnly);

// GET /api/logs
router.get('/', (req, res) => {
  try {
    const search = req.query.search || '';
    const targetId = req.query.targetId || null;
    const module = req.query.module || null;
    const action = req.query.action || null;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (search) {
      const s = `%${search}%`;
      query += ` AND (username LIKE ? OR module LIKE ? OR action LIKE ? OR target_id LIKE ? OR details LIKE ?)`;
      params.push(s, s, s, s, s);
    }

    if (targetId) {
      query += ` AND target_id = ?`;
      params.push(targetId);
    }

    if (module) {
      query += ` AND LOWER(module) = LOWER(?)`;
      params.push(module);
    }

    if (action) {
      query += ` AND LOWER(action) = LOWER(?)`;
      params.push(action);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Loglar getirilirken hata oluştu.', error: err.message });
  }
});

module.exports = router;
