const db = require('./database/db.js');
const result = db.prepare('UPDATE users SET role = ? WHERE username = ?').run('admin', 'admin');
console.log('Update result:', result);
const check = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get('admin');
console.log('User status after update:', check);
