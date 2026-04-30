const db = require('./db.js');
console.log(db.prepare("SELECT * FROM personnel WHERE first_name LIKE '%ufuk%'").all());
