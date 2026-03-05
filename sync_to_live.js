
const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'simcardtracking.db');
const db = new Database(dbPath);

const data = {
  "operators": [
    {
      "id": 2,
      "name": "Turkcell"
    },
    {
      "id": 3,
      "name": "Türk Telekom"
    },
    {
      "id": 1,
      "name": "Vodafone"
    }
  ],
  "packages": [
    {
      "id": 11,
      "name": "Eko Paket",
      "type": "voice",
      "operator_id": 2,
      "price": 1100,
      "features": "",
      "created_at": "2026-03-05 10:07:54",
      "data_limit": 0.5,
      "sms_limit": 100,
      "minutes_limit": 900,
      "operator_name": "Turkcell"
    },
    {
      "id": 12,
      "name": "İşte Süper 2",
      "type": "voice",
      "operator_id": 2,
      "price": 1330,
      "features": "",
      "created_at": "2026-03-05 10:08:26",
      "data_limit": 2,
      "sms_limit": 250,
      "minutes_limit": 750,
      "operator_name": "Turkcell"
    },
    {
      "id": 13,
      "name": "Avantaj Paket",
      "type": "voice",
      "operator_id": 2,
      "price": 1450,
      "features": "",
      "created_at": "2026-03-05 10:09:05",
      "data_limit": 0.5,
      "sms_limit": 100,
      "minutes_limit": 1500,
      "operator_name": "Turkcell"
    },
    {
      "id": 14,
      "name": "İşte Özgür Platin 10000 Dk 25 GB",
      "type": "voice",
      "operator_id": 2,
      "price": 1650,
      "features": "",
      "created_at": "2026-03-05 10:09:39",
      "data_limit": 25,
      "sms_limit": 250,
      "minutes_limit": 10000,
      "operator_name": "Turkcell"
    },
    {
      "id": 15,
      "name": "İşte Süper 4",
      "type": "voice",
      "operator_id": 2,
      "price": 1650,
      "features": "",
      "created_at": "2026-03-05 10:10:01",
      "data_limit": 4,
      "sms_limit": 250,
      "minutes_limit": 1000,
      "operator_name": "Turkcell"
    },
    {
      "id": 16,
      "name": "İşte Süper 6",
      "type": "voice",
      "operator_id": 2,
      "price": 2100,
      "features": "",
      "created_at": "2026-03-05 10:10:26",
      "data_limit": 6,
      "sms_limit": 250,
      "minutes_limit": 1500,
      "operator_name": "Turkcell"
    },
    {
      "id": 17,
      "name": "Star Paket",
      "type": "voice",
      "operator_id": 2,
      "price": 2300,
      "features": "",
      "created_at": "2026-03-05 10:10:54",
      "data_limit": 0.5,
      "sms_limit": 100,
      "minutes_limit": 9000,
      "operator_name": "Turkcell"
    },
    {
      "id": 18,
      "name": "İşte Özgür Black 10000 Dk 35 GB",
      "type": "voice",
      "operator_id": 2,
      "price": 2500,
      "features": "",
      "created_at": "2026-03-05 10:11:42",
      "data_limit": 35,
      "sms_limit": 250,
      "minutes_limit": 10000,
      "operator_name": "Turkcell"
    },
    {
      "id": 19,
      "name": "İşte Süper Platin 8",
      "type": "voice",
      "operator_id": 2,
      "price": 2700,
      "features": "",
      "created_at": "2026-03-05 10:12:59",
      "data_limit": 8,
      "sms_limit": 250,
      "minutes_limit": 3000,
      "operator_name": "Turkcell"
    },
    {
      "id": 20,
      "name": "İşte Süper Platin 10",
      "type": "voice",
      "operator_id": 2,
      "price": 3100,
      "features": "",
      "created_at": "2026-03-05 10:13:20",
      "data_limit": 10,
      "sms_limit": 250,
      "minutes_limit": 9000,
      "operator_name": "Turkcell"
    },
    {
      "id": 21,
      "name": "İşte Süper Platin 15 GB",
      "type": "voice",
      "operator_id": 2,
      "price": 3900,
      "features": "",
      "created_at": "2026-03-05 10:13:43",
      "data_limit": 15,
      "sms_limit": 250,
      "minutes_limit": 10000,
      "operator_name": "Turkcell"
    },
    {
      "id": 22,
      "name": "İşte Süper Platin 20 GB",
      "type": "voice",
      "operator_id": 2,
      "price": 4300,
      "features": "",
      "created_at": "2026-03-05 10:14:02",
      "data_limit": 20,
      "sms_limit": 250,
      "minutes_limit": 12000,
      "operator_name": "Turkcell"
    },
    {
      "id": 23,
      "name": "İşte Süper Platin Black 30 GB",
      "type": "voice",
      "operator_id": 2,
      "price": 5050,
      "features": "",
      "created_at": "2026-03-05 10:14:26",
      "data_limit": 30,
      "sms_limit": 13000,
      "minutes_limit": 250,
      "operator_name": "Turkcell"
    },
    {
      "id": 24,
      "name": "İşte Süper Platin Black 50",
      "type": "voice",
      "operator_id": 2,
      "price": 7200,
      "features": "",
      "created_at": "2026-03-05 10:14:53",
      "data_limit": 50,
      "sms_limit": 250,
      "minutes_limit": 15000,
      "operator_name": "Turkcell"
    },
    {
      "id": 25,
      "name": "Kurumsal Durmayan Ses Platin",
      "type": "voice",
      "operator_id": 2,
      "price": 7200,
      "features": "",
      "created_at": "2026-03-05 10:15:17",
      "data_limit": 50,
      "sms_limit": 1000,
      "minutes_limit": 1000,
      "operator_name": "Turkcell"
    },
    {
      "id": 26,
      "name": "İşte Süper Platin Black 100",
      "type": "voice",
      "operator_id": 2,
      "price": 8400,
      "features": "",
      "created_at": "2026-03-05 10:15:41",
      "data_limit": 100,
      "sms_limit": 250,
      "minutes_limit": 16000,
      "operator_name": "Turkcell"
    },
    {
      "id": 27,
      "name": "İşte Süper Platin Black 150",
      "type": "voice",
      "operator_id": 2,
      "price": 9300,
      "features": "",
      "created_at": "2026-03-05 10:16:04",
      "data_limit": 150,
      "sms_limit": 18000,
      "minutes_limit": 250,
      "operator_name": "Turkcell"
    }
  ]
};

console.log('--- Veri Senkronizasyonu Ba┼şlat─▒l─▒yor ---');

db.transaction(() => {
    // 1. Operat├Ârleri senkronize et (Yoksa ekle)
    for (const op of data.operators) {
        const existing = db.prepare('SELECT id FROM operators WHERE name = ?').get(op.name);
        if (!existing) {
            console.log('Yeni operat├Âr ekleniyor: ' + op.name);
            db.prepare('INSERT INTO operators (name) VALUES (?)').run(op.name);
        }
    }

    // 2. Paketleri senkronize et
    for (const pkg of data.packages) {
        // Canl─▒da operat├Âr ID'si farkl─▒ olabilir, isme g├Âre bulal─▒m
        let targetOpId = null;
        if (pkg.operator_name) {
            const op = db.prepare('SELECT id FROM operators WHERE name = ?').get(pkg.operator_name);
            if (op) targetOpId = op.id;
        }

        const existing = db.prepare('SELECT id FROM packages WHERE name = ? AND type = ?').get(pkg.name, pkg.type);
        
        const params = [
            pkg.name, 
            pkg.type, 
            targetOpId, 
            pkg.price || 0, 
            pkg.features || '', 
            pkg.data_limit || null, 
            pkg.sms_limit || null, 
            pkg.minutes_limit || null
        ];

        if (existing) {
            console.log('Paket g├╝ncelleniyor: ' + pkg.name + ' (' + pkg.type + ')');
            db.prepare(`
                UPDATE packages SET 
                    operator_id = ?, 
                    price = ?, 
                    features = ?, 
                    data_limit = ?, 
                    sms_limit = ?, 
                    minutes_limit = ? 
                WHERE id = ?
            `).run(targetOpId, pkg.price, pkg.features, pkg.data_limit, pkg.sms_limit, pkg.minutes_limit, existing.id);
        } else {
            console.log('Yeni paket ekleniyor: ' + pkg.name + ' (' + pkg.type + ')');
            db.prepare(`
                INSERT INTO packages (name, type, operator_id, price, features, data_limit, sms_limit, minutes_limit) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(...params);
        }
    }
})();

console.log('--- Senkronizasyon Tamamland─▒ ---');
