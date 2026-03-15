const db = require('./database/db');

try {
  // Migrate personnel from sim_voice
  console.log('Migrating personnel from sim_voice...');
  const voiceSims = db.prepare("SELECT DISTINCT assigned_to, department, assigned_company FROM sim_voice WHERE assigned_to IS NOT NULL AND assigned_to != ''").all();
  
  const insertPersonnel = db.prepare('INSERT INTO personnel (first_name, last_name, department, company) VALUES (?, ?, ?, ?)');
  const checkPersonnel = db.prepare('SELECT id FROM personnel WHERE first_name = ? AND last_name = ?');
  
  let pCount = 0;
  for (const sim of voiceSims) {
    let first = sim.assigned_to.trim();
    let last = '-'; // Fallback for last name as it's required in personnel
    const parts = first.split(' ');
    if (parts.length > 1) {
      last = parts.pop();
      first = parts.join(' ');
    }
    
    if (!checkPersonnel.get(first, last)) {
      insertPersonnel.run(first, last, sim.department || null, sim.assigned_company || null);
      pCount++;
    }
  }
  console.log(`Added ${pCount} personnel records.`);

  // Migrate locations from sim_data
  console.log('Migrating locations from sim_data...');
  const dataSims = db.prepare("SELECT DISTINCT location FROM sim_data WHERE location IS NOT NULL AND location != ''").all();
  
  const insertLoc = db.prepare('INSERT INTO locations (name) VALUES (?)');
  const checkLoc = db.prepare('SELECT id FROM locations WHERE name = ?');
  
  let lCount = 0;
  for (const sim of dataSims) {
    if (!checkLoc.get(sim.location)) {
      insertLoc.run(sim.location);
      lCount++;
    }
  }
  console.log(`Added ${lCount} locations.`);

  console.log('Migration completed successfully.');
} catch (e) {
  console.error('Migration failed:', e);
}
