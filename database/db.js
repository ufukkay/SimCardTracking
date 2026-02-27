const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'simcardtracking.db'));

// WAL modu performans için
db.pragma('journal_mode = WAL');

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sim_m2m (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iccid TEXT,
    phone_no TEXT,
    operator TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    plate_no TEXT,
    vehicle_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sim_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iccid TEXT,
    phone_no TEXT,
    operator TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sim_voice (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iccid TEXT,
    phone_no TEXT,
    operator TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    assigned_to TEXT,
    department TEXT,
    assigned_company TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_no TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    department TEXT,
    company TEXT,
    phone TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Default operatörler
const seedOperators = db.prepare(`INSERT OR IGNORE INTO operators (name) VALUES (?)`);
['Vodafone', 'Turkcell', 'Türk Telekom'].forEach(name => seedOperators.run(name));

// Default admin kullanıcı
const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, first_name, last_name, company, role, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin', 'Admin', 'Kullanıcı', 'Sistem', 'admin', hash);
  console.log('Default admin oluşturuldu: admin / admin123');
}

module.exports = db;
