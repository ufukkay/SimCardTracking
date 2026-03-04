const db = require('../database/db');

/**
 * Logs a user activity to the database.
 * @param {Object} req - Express request object (to extract user and IP)
 * @param {string} action - The action performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
 * @param {string} module - The module affected (e.g., 'M2M', 'DATA', 'VOICE', 'AUTH', 'USERS')
 * @param {string|number} targetId - ID of the affected record (optional)
 * @param {string|object} details - Additional information or context (optional)
 */
function logActivity(req, action, module, targetId = null, details = null) {
  try {
    const userId = req.user ? req.user.id : null;
    const username = req.user ? req.user.username : 'system';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    let detailStr = details;
    if (details && typeof details === 'object') {
      detailStr = JSON.stringify(details);
    }

    const stmt = db.prepare(`
      INSERT INTO activity_logs (user_id, username, action, module, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `);
    
    stmt.run(userId, username, action, module, targetId ? String(targetId) : null, detailStr, ipAddress);
  } catch (err) {
    console.error('[LOGGER_ERROR]', err);
  }
}

module.exports = { logActivity };
