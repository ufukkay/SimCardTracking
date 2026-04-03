const path = require('path');
const db = require(path.join(__dirname, '..', 'database', 'db'));

const normalizePhone = (value) => {
  if (!value) return '';
  return String(value).replace(/\D/g, '').slice(-10);
};

const sanitizePhoneSQL = (column) => `substr(replace(replace(replace(replace(replace(COALESCE(${column}, ''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), -10)`;

const PERSONNEL_PHONE = sanitizePhoneSQL('phone');
const VOICE_PHONE = sanitizePhoneSQL('phone_no');
const DATA_PHONE = sanitizePhoneSQL('phone_no');
const M2M_PHONE = sanitizePhoneSQL('phone_no');

const invoices = db.prepare('SELECT id, phone_no, personnel_name, cost_center, company_name FROM invoices').all();
const updateStmt = db.prepare('UPDATE invoices SET personnel_name = ?, cost_center = ?, company_name = ? WHERE id = ?');

let updated = 0;

const findInfo = (phoneNo) => {
  const clean = normalizePhone(phoneNo);
  if (!clean) return null;

  const personnel = db.prepare(`SELECT first_name || ' ' || last_name AS name, cost_center, company FROM personnel WHERE ${PERSONNEL_PHONE} = ? LIMIT 1`).get(clean);
  if (personnel && personnel.name) return personnel;

  const voice = db.prepare(`SELECT assigned_to AS name, department, assigned_company FROM sim_voice WHERE ${VOICE_PHONE} = ? LIMIT 1`).get(clean);
  if (voice && voice.name) {
    const p = db.prepare('SELECT cost_center, company FROM personnel WHERE (first_name || " " || last_name) = ? LIMIT 1').get(voice.name);
    return {
      name: voice.name,
      cost_center: voice.department || (p ? p.cost_center : null) || null,
      company: voice.assigned_company || (p ? p.company : null) || null,
    };
  }

  const data = db.prepare(`SELECT location AS name FROM sim_data WHERE ${DATA_PHONE} = ? LIMIT 1`).get(clean);
  if (data && data.name) {
    return { name: `${data.name} (DATA)`, cost_center: null, company: null };
  }

  const m2m = db.prepare(`SELECT plate_no AS name FROM sim_m2m WHERE ${M2M_PHONE} = ? LIMIT 1`).get(clean);
  if (m2m && m2m.name) {
    return { name: `${m2m.name} (M2M)`, cost_center: 'LOJISTIK', company: null };
  }

  return null;
};

for (const row of invoices) {
  if (row.personnel_name && row.cost_center) continue;
  const info = findInfo(row.phone_no);
  if (!info) continue;
  const name = row.personnel_name || info.name;
  const costCenter = row.cost_center || info.cost_center || null;
  const company = row.company_name || info.company || null;
  updateStmt.run(name, costCenter, company, row.id);
  updated++;
}

console.log(`Güncellenen fatura kaydı: ${updated}`);
