const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'simcardtracking.db');

// --- Canli veritabani referansi (reopen ile degistirilebilir) ---
let _db = null;

function initializeDb(database) {
  // WAL modu performans icin
  database.pragma('journal_mode = WAL');

  // Tablolari olustur
  database.exec(`
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
      permissions TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('m2m', 'data', 'voice', 'general')),
      operator_id INTEGER NOT NULL,
      price REAL DEFAULT 0,
      data_limit REAL DEFAULT NULL,
      sms_limit INTEGER DEFAULT NULL,
      minutes_limit INTEGER DEFAULT NULL,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(operator_id) REFERENCES operators(id)
    );

    CREATE TABLE IF NOT EXISTS sim_m2m (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      iccid TEXT,
      phone_no TEXT,
      operator TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      plate_no TEXT,
      vehicle_type TEXT,
      company TEXT,
      notes TEXT,
      package_id INTEGER REFERENCES packages(id),
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
      company TEXT,
      notes TEXT,
      package_id INTEGER REFERENCES packages(id),
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
      package_id INTEGER REFERENCES packages(id),
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
      cost_center TEXT,
      phone TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator TEXT NOT NULL,
      period TEXT NOT NULL,
      phone_no TEXT,
      personnel_name TEXT,
      cost_center TEXT,
      company_name TEXT,
      tariff TEXT,
      amount REAL DEFAULT 0,
      tax_kdv REAL DEFAULT 0,
      tax_oiv REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      source_file TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // --- Schema Migrations ---
  try { database.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE sim_m2m ADD COLUMN package_id INTEGER REFERENCES packages(id)`); } catch (_) {}
  try { database.exec(`ALTER TABLE sim_m2m ADD COLUMN company TEXT DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE sim_data ADD COLUMN package_id INTEGER REFERENCES packages(id)`); } catch (_) {}
  try { database.exec(`ALTER TABLE sim_data ADD COLUMN company TEXT DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE sim_voice ADD COLUMN package_id INTEGER REFERENCES packages(id)`); } catch (_) {}
  try { database.exec(`ALTER TABLE packages ADD COLUMN data_limit REAL DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE packages ADD COLUMN sms_limit INTEGER DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE packages ADD COLUMN minutes_limit INTEGER DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE personnel ADD COLUMN cost_center TEXT DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE invoices ADD COLUMN cost_center TEXT DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE invoices ADD COLUMN company_name TEXT DEFAULT NULL`); } catch (_) {}
  try { database.exec(`ALTER TABLE invoices ADD COLUMN is_matched INTEGER DEFAULT 0`); } catch (_) {}
  try { database.exec(`ALTER TABLE invoices ADD COLUMN source_file TEXT DEFAULT NULL`); } catch (_) {}

  // --- Performance Indexes ---
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_m2m_plate_no     ON sim_m2m  (plate_no);
    CREATE INDEX IF NOT EXISTS idx_m2m_phone_no     ON sim_m2m  (phone_no);
    CREATE INDEX IF NOT EXISTS idx_m2m_iccid        ON sim_m2m  (iccid);
    CREATE INDEX IF NOT EXISTS idx_m2m_operator     ON sim_m2m  (operator);
    CREATE INDEX IF NOT EXISTS idx_m2m_status       ON sim_m2m  (status);
    CREATE INDEX IF NOT EXISTS idx_m2m_vehicle_type ON sim_m2m  (vehicle_type);
    CREATE INDEX IF NOT EXISTS idx_m2m_company      ON sim_m2m  (company);

    CREATE INDEX IF NOT EXISTS idx_data_phone_no    ON sim_data (phone_no);
    CREATE INDEX IF NOT EXISTS idx_data_iccid       ON sim_data (iccid);
    CREATE INDEX IF NOT EXISTS idx_data_operator    ON sim_data (operator);
    CREATE INDEX IF NOT EXISTS idx_data_status      ON sim_data (status);
    CREATE INDEX IF NOT EXISTS idx_data_location    ON sim_data (location);
    CREATE INDEX IF NOT EXISTS idx_data_company     ON sim_data (company);

    CREATE INDEX IF NOT EXISTS idx_voice_phone_no   ON sim_voice (phone_no);
    CREATE INDEX IF NOT EXISTS idx_voice_iccid      ON sim_voice (iccid);
    CREATE INDEX IF NOT EXISTS idx_voice_operator   ON sim_voice (operator);
    CREATE INDEX IF NOT EXISTS idx_voice_status     ON sim_voice (status);
    CREATE INDEX IF NOT EXISTS idx_voice_assigned_to ON sim_voice (assigned_to);

    CREATE INDEX IF NOT EXISTS idx_vehicles_plate_no ON vehicles  (plate_no);
    CREATE INDEX IF NOT EXISTS idx_logs_user_id      ON activity_logs (user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_action       ON activity_logs (action);
    CREATE INDEX IF NOT EXISTS idx_logs_module       ON activity_logs (module);
    CREATE INDEX IF NOT EXISTS idx_logs_created_at   ON activity_logs (created_at);
    CREATE INDEX IF NOT EXISTS idx_invoices_period   ON invoices (period);
    CREATE INDEX IF NOT EXISTS idx_invoices_phone    ON invoices (phone_no);
    CREATE INDEX IF NOT EXISTS idx_invoices_source   ON invoices (source_file);
  `);

  // --- Packages type constraint migration ---
  try {
    const tableInfo = database.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='packages'`).get();
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'general'")) {
      database.exec(`
        PRAGMA foreign_keys = OFF;
        ALTER TABLE packages RENAME TO _packages_old;
        CREATE TABLE packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('m2m', 'data', 'voice', 'general')),
          operator_id INTEGER NOT NULL,
          price REAL DEFAULT 0,
          data_limit REAL DEFAULT NULL,
          sms_limit INTEGER DEFAULT NULL,
          minutes_limit INTEGER DEFAULT NULL,
          features TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(operator_id) REFERENCES operators(id)
        );
        INSERT INTO packages SELECT * FROM _packages_old;
        DROP TABLE _packages_old;
        PRAGMA foreign_keys = ON;
      `);
      console.log('[DB] packages tablosu guncellendi: general tipi eklendi.');
    }
  } catch (migErr) { console.warn('[DB] packages migration hatasi:', migErr.message); }

  try { database.exec(`CREATE INDEX IF NOT EXISTS idx_m2m_package_id   ON sim_m2m  (package_id)`); } catch (_) {}
  try { database.exec(`CREATE INDEX IF NOT EXISTS idx_data_package_id  ON sim_data (package_id)`); } catch (_) {}
  try { database.exec(`CREATE INDEX IF NOT EXISTS idx_voice_package_id ON sim_voice (package_id)`); } catch (_) {}

  // Default operatorler
  const seedOperators = database.prepare(`INSERT OR IGNORE INTO operators (name) VALUES (?)`);
  ['Vodafone', 'Turkcell', 'Turk Telekom'].forEach(name => seedOperators.run(name));

  // Default admin kullanici
  const existingAdmin = database.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    database.prepare(`
      INSERT INTO users (username, first_name, last_name, company, role, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', 'Admin', 'Kullanici', 'Sistem', 'admin', hash);
    console.log('Default admin olusturuldu: admin / admin123');
  }
}

// --- Ilk baslatma ---
_db = new Database(DB_PATH);
initializeDb(_db);

// --- Proxy: Tum db cagrilari canli _db referansina yonlendirilir ---
// Bu sayede restore sonrasi reopen() cagrildiginda tum route'lar yeni db'yi kullanir
const dbProxy = new Proxy({}, {
  get(target, prop) {
    // Ozel metotlar
    if (prop === 'reopen') {
      return function () {
        console.log('[DB] Veritabani yeniden aciliyor...');
        _db = new Database(DB_PATH);
        initializeDb(_db);
        console.log('[DB] Veritabani basariyla yeniden acildi.');
      };
    }
    if (prop === 'safeClose') {
      return function () {
        try {
          if (_db && _db.open) {
            _db.close();
            console.log('[DB] Veritabani baglantisi kapatildi.');
          }
        } catch (e) {
          console.error('[DB] Kapatma hatasi:', e.message);
        }
      };
    }
    if (prop === 'getPath') {
      return function () { return DB_PATH; };
    }

    // Diger tum property/metotlari canli _db'den al
    const value = _db[prop];
    if (typeof value === 'function') {
      return value.bind(_db);
    }
    return value;
  }
});

module.exports = dbProxy;
