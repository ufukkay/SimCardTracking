const db = require('../database/db');

const cleanPhone = (phone_no) => {
  let clean = phone_no || null;
  if (clean) {
    const digits = clean.toString().replace(/\D/g, '').slice(-10);
    clean = digits.length === 10 ? '0' + digits : clean;
  }
  return clean;
};

const checkDuplicatePhone = (cleanPhone, excludeId = null, excludeTable = null) => {
  if (!cleanPhone) return false;
  
  const tables = ['sim_m2m', 'sim_data', 'sim_voice'];
  
  const parts = tables.map(table => {
    if (excludeId && table === excludeTable) {
      return `SELECT 1 FROM ${table} WHERE phone_no = ? AND id != ?`;
    }
    return `SELECT 1 FROM ${table} WHERE phone_no = ?`;
  });

  const query = parts.join(' UNION ALL ') + ' LIMIT 1';
  
  const params = [];
  tables.forEach(table => {
    params.push(cleanPhone);
    if (excludeId && table === excludeTable) {
      params.push(excludeId);
    }
  });

  const exists = db.prepare(query).get(...params);
  return !!exists;
};

const syncLocation = (location) => {
  if (location) {
    try {
      const existing = db.prepare('SELECT id FROM locations WHERE name = ?').get(location);
      if (!existing) {
        db.prepare('INSERT INTO locations (name) VALUES (?)').run(location);
      }
    } catch (e) {
      console.error('Error syncing location:', e);
    }
  }
};

const syncCompany = (company) => {
  if (company) {
    try {
      const existing = db.prepare('SELECT id FROM companies WHERE name = ?').get(company);
      if (!existing) {
        db.prepare('INSERT INTO companies (name) VALUES (?)').run(company);
      }
    } catch (e) {
      // Ignored if table doesn't exist or other error
    }
  }
};

const syncPersonnel = (fullName, department, company) => {
  if (!fullName) return;
  const nameParts = fullName.trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts.pop() : '';
  const firstName = nameParts.join(' ') || fullName;

  try {
    const existing = db.prepare('SELECT id FROM personnel WHERE first_name = ? AND last_name = ?').get(firstName, lastName);
    if (!existing) {
      db.prepare('INSERT INTO personnel (first_name, last_name, department, company) VALUES (?, ?, ?, ?)').run(firstName, lastName, department || null, company || null);
    }
  } catch (e) {
    console.error('Error syncing personnel:', e);
  }
};

module.exports = {
  cleanPhone,
  checkDuplicatePhone,
  syncLocation,
  syncCompany,
  syncPersonnel
};
