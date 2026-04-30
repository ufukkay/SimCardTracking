const db = require('./db.js');
const rows = db.prepare("SELECT * FROM sim_voice WHERE assigned_to LIKE '%kaya%'").all();
console.log(rows);
