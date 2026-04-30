const db = require('./db.js');
console.log("sim_voice: ", db.prepare("SELECT * FROM sim_voice WHERE assigned_to LIKE '%ufuk%'").all());
try { console.log("sim_data: ", db.prepare("SELECT * FROM sim_data WHERE assigned_to LIKE '%ufuk%'").all()); } catch(e) {}
try { console.log("sim_m2m: ", db.prepare("SELECT * FROM sim_m2m WHERE assigned_to LIKE '%ufuk%'").all()); } catch(e) {}
console.log("personnel: ", db.prepare("SELECT * FROM personnel WHERE first_name LIKE '%ufuk%' OR last_name LIKE '%ufuk%'").all());
