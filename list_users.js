const db = require('./database/db.js');
const allUsers = db.prepare('SELECT * FROM users').all();
console.log('--- ALL USERS ---');
console.log(allUsers.map(u => ({ id: u.id, username: u.username, name: u.first_name + ' ' + u.last_name, role: u.role })));
console.log('--- SEARCHING FOR KRAL ---');
const kralUsers = allUsers.filter(u => 
  (u.username && u.username.toLowerCase().includes('kral')) ||
  (u.first_name && u.first_name.toLowerCase().includes('kral')) ||
  (u.last_name && u.last_name.toLowerCase().includes('kral'))
);
console.log(kralUsers);
