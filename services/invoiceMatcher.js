const db = require('../database/db');

const normalizeText = (str) => {
  if (!str) return '';
  return str.toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
};


const normalizePhone = (value) => {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? '0' + digits : digits;
};

const sanitizePhoneSQL = (column) => `'0' || substr(replace(replace(replace(replace(replace(COALESCE(${column}, ''), ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''), -10)`;
const PERSONNEL_PHONE_EXPR = sanitizePhoneSQL('phone');
const VOICE_PHONE_EXPR = sanitizePhoneSQL('phone_no');
const M2M_PHONE_EXPR = sanitizePhoneSQL('phone_no');
const DATA_PHONE_EXPR = sanitizePhoneSQL('phone_no');

function findPersonnelByPhone(phoneNo) {
  const cleanPhone = normalizePhone(phoneNo);
  if (!cleanPhone) return { name: '', costCenter: '', company: '', tariff: '', isMatched: false };
  try {
    // 1. Ses hatları tablosunda ara (atanmış bir personel var mı? + Paket bilgisi)
    let res = db.prepare(`
      SELECT sv.assigned_to as name, sv.department, sv.assigned_company, p.name as package_name
      FROM sim_voice sv
      LEFT JOIN packages p ON sv.package_id = p.id
      WHERE ${VOICE_PHONE_EXPR} = ? LIMIT 1
    `).get(cleanPhone);

    if (res) {
      // Bulunan isme göre masraf kalemini personellerden bulmaya çalış
      let p = null;
      if (res.name) {
        const personnelList = db.prepare('SELECT first_name, last_name, cost_center, company FROM personnel').all();
        const target = normalizeText(res.name);
        p = personnelList.find(x => {
            const fullName = normalizeText(`${x.first_name} ${x.last_name}`);
            return fullName === target || normalizeText(x.first_name) === target || normalizeText(x.last_name) === target;
        });
      }
      
      return {
        name: res.name || res.assigned_company || '',
        costCenter: (p && p.cost_center) ? p.cost_center : (res.department || ''),
        company: res.assigned_company || (p ? (p.company || '') : ''),
        tariff: res.package_name || '',
        isMatched: true
      };
    }

    // 2. M2M hatlarında ara (Araç plakası + Paket bilgisi)
    res = db.prepare(`
      SELECT m.plate_no as name, m.company, p.name as package_name 
      FROM sim_m2m m
      LEFT JOIN packages p ON m.package_id = p.id
      WHERE ${M2M_PHONE_EXPR} = ? LIMIT 1
    `).get(cleanPhone);
    if (res) return { name: res.name || res.company || '', costCenter: res.company || '', company: res.company || '', tariff: res.package_name || '', isMatched: true };

    // 3. Data hatlarında ara (Lokasyon + Paket bilgisi)
    res = db.prepare(`
      SELECT d.location as name, d.company, p.name as package_name 
      FROM sim_data d 
      LEFT JOIN packages p ON d.package_id = p.id
      WHERE ${DATA_PHONE_EXPR} = ? LIMIT 1
    `).get(cleanPhone);
    if (res) return { name: res.name || res.company || '', costCenter: '', company: res.company || '', tariff: res.package_name || '', isMatched: true };

    // 4. Eğer hiçbir sim tablosunda yoksa, personeller tablosunda bu telefonu ara (Sadece yedek)
    res = db.prepare(`SELECT first_name || ' ' || last_name as name, cost_center, company FROM personnel WHERE ${PERSONNEL_PHONE_EXPR} = ? LIMIT 1`).get(cleanPhone);
    if (res && res.name) return { name: res.name, costCenter: res.cost_center || '', company: res.company || '', tariff: '', isMatched: true };

    return { name: '', costCenter: '', company: '', tariff: '', isMatched: false };
  } catch (e) {
    console.error('Invoice Matcher - Lookup Error:', e);
    return { name: '', costCenter: '', company: '', tariff: '', isMatched: false };
  }
}

module.exports = {
  findPersonnelByPhone,
  normalizePhone
};
