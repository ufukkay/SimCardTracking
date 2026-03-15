const db = require('./database/db');
console.log('Deleted records:', db.prepare("DELETE FROM personnel WHERE first_name = '' OR last_name = '' OR last_name = '-'").run().changes);
