const db = require('./database/db.js');
console.log('--- Current Status ---');
console.log(db.prepare('SELECT id, username, first_name, last_name, role FROM users').all());
const update = db.prepare('UPDATE users SET role = ? WHERE username = ?').run('admin', 'admin');
console.log('--- Update result ---', update);
console.log('--- Status After Update ---');
console.log(db.prepare('SELECT id, username, role FROM users WHERE username = ?').get('admin'));
