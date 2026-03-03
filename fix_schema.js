const db = require('./database/db');

console.log('Fixing schema...');

db.exec(`
  PRAGMA foreign_keys = OFF;

  -- Fix sim_m2m
  CREATE TABLE sim_m2m_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iccid TEXT,
    phone_no TEXT,
    operator TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    plate_no TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    vehicle_type TEXT,
    package_id INTEGER REFERENCES packages(id)
  );
  INSERT INTO sim_m2m_new SELECT id, iccid, phone_no, operator, status, plate_no, notes, created_at, updated_at, vehicle_type, package_id FROM sim_m2m;
  DROP TABLE sim_m2m;
  ALTER TABLE sim_m2m_new RENAME TO sim_m2m;
  CREATE INDEX idx_m2m_plate_no ON sim_m2m(plate_no);
  CREATE INDEX idx_m2m_phone_no ON sim_m2m(phone_no);
  CREATE INDEX idx_m2m_iccid ON sim_m2m(iccid);
  CREATE INDEX idx_m2m_operator ON sim_m2m(operator);
  CREATE INDEX idx_m2m_status ON sim_m2m(status);
  CREATE INDEX idx_m2m_vehicle_type ON sim_m2m(vehicle_type);
  CREATE INDEX idx_m2m_package_id ON sim_m2m(package_id);

  -- Fix sim_data
  CREATE TABLE sim_data_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iccid TEXT,
    phone_no TEXT,
    operator TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    package_id INTEGER REFERENCES packages(id)
  );
  INSERT INTO sim_data_new SELECT id, iccid, phone_no, operator, status, location, notes, created_at, updated_at, package_id FROM sim_data;
  DROP TABLE sim_data;
  ALTER TABLE sim_data_new RENAME TO sim_data;
  CREATE INDEX idx_data_phone_no ON sim_data(phone_no);
  CREATE INDEX idx_data_iccid ON sim_data(iccid);
  CREATE INDEX idx_data_operator ON sim_data(operator);
  CREATE INDEX idx_data_status ON sim_data(status);
  CREATE INDEX idx_data_location ON sim_data(location);
  CREATE INDEX idx_data_package_id ON sim_data(package_id);

  -- Fix sim_voice
  CREATE TABLE sim_voice_new (
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    package_id INTEGER REFERENCES packages(id)
  );
  INSERT INTO sim_voice_new SELECT id, iccid, phone_no, operator, status, assigned_to, department, assigned_company, notes, created_at, updated_at, package_id FROM sim_voice;
  DROP TABLE sim_voice;
  ALTER TABLE sim_voice_new RENAME TO sim_voice;
  CREATE INDEX idx_voice_phone_no ON sim_voice(phone_no);
  CREATE INDEX idx_voice_iccid ON sim_voice(iccid);
  CREATE INDEX idx_voice_operator ON sim_voice(operator);
  CREATE INDEX idx_voice_status ON sim_voice(status);
  CREATE INDEX idx_voice_assigned_to ON sim_voice(assigned_to);
  CREATE INDEX idx_voice_package_id ON sim_voice(package_id);

  PRAGMA foreign_keys = ON;
`);

console.log('Schema fixed successfully.');
