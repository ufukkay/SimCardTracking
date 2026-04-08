const express = require("express");
const router = express.Router();
const XLSX = require("xlsx");
const multer = require("multer");
const db = require("../database/db");
const { authMiddleware } = require("../middleware/auth");
const { logActivity } = require("../middleware/logger");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ─── EXCEL TEMPLATE DOWNLOAD (Public) ─── */
// GET /api/import/template/:type  (m2m | data | voice)
router.get("/template/:type", (req, res) => {
  const type = req.params.type;
  const templates = {
    m2m: {
      filename: 'M2M_Sablon.xlsx',
      headers: ['ICCID', 'Telefon No', 'Operatör', 'Şirket', 'Araç Tipi / Kullanım Amacı', 'Durum', 'Plaka', 'Notlar'],
      example: [
        ['8990011234567890', '05301234567', 'Vodafone', 'ABC Lojistik', 'Binek',       'active', '34 ABC 001', 'Araç 1'],
        ['8990017654321098', '05301234568', 'Turkcell', 'XYZ Nakliyat', 'Yol Kamerası','spare',  '',           'Yedek'],
      ],
      note: 'Durum değerleri: active (Aktif), spare (Yedek), passive (Pasif)\nAraç Tipi / Kullanım Amacı örnekleri: Binek, Çekici, Yol Kamerası, IoT Cihazı, vb.'
    },
    data: {
      filename: "Data_Sablon.xlsx",
      headers: [
        "ICCID",
        "Telefon No",
        "Operatör",
        "Şirket",
        "Durum",
        "Lokasyon",
        "Notlar",
      ],
      example: [
        [
          "8990011234567890",
          "05301234567",
          "Vodafone",
          "ABC Ofisleri",
          "active",
          "A Ofisi",
          "",
        ],
        [
          "8990017654321098",
          "05301234568",
          "Türk Telekom",
          "active",
          "B Ofisi",
          "",
        ],
      ],
      note: "Durum değerleri: active (Aktif), spare (Yedek), passive (Pasif)",
    },
    voice: {
      filename: "Ses_Sablon.xlsx",
      headers: [
        "ICCID",
        "Telefon No",
        "Operatör",
        "Durum",
        "Personel Adı",
        "Departman",
        "Şirket",
        "Masraf Kalemi",
        "Notlar",
      ],
      example: [
        [
          "8990011234567890",
          "05301234567",
          "Turkcell",
          "active",
          "Ahmet Yılmaz",
          "IT",
          "ABC A.Ş.",
          "ITB-123",
          "",
        ],
        [
          "8990017654321098",
          "05301234568",
          "Vodafone",
          "active",
          "Ayşe Kaya",
          "Muhasebe",
          "ABC A.Ş.",
          "MUH-456",
          "",
        ],
      ],
      note: "Durum değerleri: active (Aktif), spare (Yedek), passive (Pasif)",
    },
    packages: {
      filename: "Paket_Sablon.xlsx",
      headers: ["Paket Adı", "Tip", "Operatör", "Data (GB)", "SMS", "Dakika", "Fiyat", "Özellikler"],
      example: [
        ["Eko Paket", "m2m", "Turkcell", 1, 1000, 0, 50, "M2M için ekonomik"],
        ["Süper Data", "data", "Vodafone", 50, 0, 0, 150, "Yüksek hızlı data"],
        ["Kurumsal Ses", "voice", "Türk Telekom", 10, 5000, 2000, 250, "Full iletişim"],
      ],
      note: "Tip değerleri: m2m, data, voice\nOperatör adı mevcut operatörlerden biri olmalıdır."
    },
    personnel: {
      filename: "Personel_Sablon.xlsx",
      headers: ["Ad", "Soyad", "Departman", "Şirket", "Masraf Kalemi", "Telefon", "Notlar"],
      example: [
        ["Ahmet", "Yılmaz", "IT", "ABC A.Ş.", "IT-123", "05301234567", "Sistem Sorumlusu"],
        ["Ayşe", "Kaya", "Muhasebe", "ABC A.Ş.", "MUH-456", "05301234568", ""],
      ],
      note: "Ad ve Soyad zorunludur."
    }
  };

  const tpl = templates[type];
  if (!tpl) return res.status(400).json({ message: "Geçersiz tip." });

  const wb = XLSX.utils.book_new();
  const data = [tpl.headers, ...tpl.example];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Header styling (column widths)
  ws["!cols"] = tpl.headers.map(() => ({ wch: 20 }));

  // Note sheet
  const noteSheet = XLSX.utils.aoa_to_sheet([
    [tpl.note],
    ["Operatör örnekleri: Vodafone, Turkcell, Türk Telekom"],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Veri");
  XLSX.utils.book_append_sheet(wb, noteSheet, "Notlar");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${tpl.filename}"`,
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.send(buf);
});

/* ─── EXCEL / JSON BULK INSERT ─── */
// POST /api/import/excel/:type — multipart/form-data with file field "file"
router.post("/excel/:type", authMiddleware, upload.single("file"), (req, res) => {
  const type = req.params.type;
  if (!req.file) return res.status(400).json({ message: "Dosya yüklenmedi." });

  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (!rows.length)
      return res.status(400).json({ message: "Dosyada veri bulunamadı." });

    const results = { inserted: 0, errors: [] };

    const insertFns = {
      m2m: (r) => {
        const plateNo   = r['Plaka'] || null;
        const vehicleType = r['Araç Tipi / Kullanım Amacı'] || r['Araç Tipi'] || null;
        let phoneNo = r['Telefon No'] || '';
        if (phoneNo) {
          const digits = phoneNo.toString().replace(/\D/g, '').slice(-10);
          phoneNo = digits.length === 10 ? '0' + digits : phoneNo;
        }
        // Auto-sync to vehicles table
        if (plateNo && plateNo.toString().trim() !== '') {
          db.prepare(`
            INSERT INTO vehicles (plate_no, vehicle_type)
            VALUES (?, ?)
            ON CONFLICT(plate_no) DO UPDATE SET
              vehicle_type = COALESCE(excluded.vehicle_type, vehicle_type)
          `).run(plateNo.toString().trim(), vehicleType);
        }
        return db
          .prepare(
            `INSERT INTO sim_m2m (iccid,phone_no,operator,status,company,plate_no,vehicle_type,notes) VALUES (?,?,?,?,?,?,?,?)`,
          )
          .run(
            r['ICCID'] || null,
            phoneNo || null,
            r['Operatör'] || null,
            r['Durum'] || 'active',
            r['Şirket'] || null,
            plateNo,
            vehicleType,
            r['Notlar'] || null,
          );
      },
      data: (r) => {
        let phoneNo = r['Telefon No'] || '';
        if (phoneNo) {
          const digits = phoneNo.toString().replace(/\D/g, '').slice(-10);
          phoneNo = digits.length === 10 ? '0' + digits : phoneNo;
        }
        return db
          .prepare(
            `INSERT INTO sim_data (iccid,phone_no,operator,status,company,location,notes) VALUES (?,?,?,?,?,?,?)`,
          )
          .run(
            r["ICCID"] || null,
            phoneNo || null,
            r["Operatör"] || null,
            r["Durum"] || "active",
            r["Şirket"] || null,
            r["Lokasyon"] || null,
            r["Notlar"] || null,
          );
      },
      voice: (r) => {
        // Personel verisini de eş zamanlı güncellemeye (varsa) çalışabiliriz, veya sadece fatura importu için saklayabiliriz.
        // Şimdilik import sırasında sadece ses hattına ekliyoruz.
        // Ancak bu bilgi sim_voice tablosunda saklanacak mı? `sim_voice` tablosunda `cost_center` kolonu var mı kontrol ettik. Yoksa personel üzerinden eşleştiririz.
        // Let's also sync to personnel just like vehicle sync for m2m
        const assignedTo = r["Personel Adı"] || null;
        const costCenter = r["Masraf Kalemi"] || null;
        let phoneNo = r["Telefon No"] || null;
        
        if (phoneNo) {
          const digits = phoneNo.toString().replace(/\D/g, '').slice(-10);
          phoneNo = digits.length === 10 ? '0' + digits : phoneNo;
        }
        
        if (assignedTo && assignedTo.toString().trim() !== '') {
           db.prepare(`
            INSERT INTO personnel (first_name, last_name, department, company, cost_center, phone)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(first_name, last_name) DO UPDATE SET
              cost_center = COALESCE(excluded.cost_center, cost_center)
           `).run(assignedTo.split(' ')[0] || '', assignedTo.split(' ').slice(1).join(' ') || '', r["Departman"], r["Şirket"], costCenter, phoneNo);
        }

        return db
          .prepare(
            `INSERT INTO sim_voice (iccid,phone_no,operator,status,assigned_to,department,assigned_company,notes) VALUES (?,?,?,?,?,?,?,?)`,
          )
          .run(
            r["ICCID"] || null,
            phoneNo,
            r["Operatör"] || null,
            r["Durum"] || "active",
            assignedTo,
            r["Departman"] || null,
            r["Şirket"] || null,
            r["Notlar"] || null,
          )
      },
      packages: (r) => {
        const opName = r["Operatör"] || r["operator"];
        const op = db.prepare('SELECT id FROM operators WHERE name = ?').get(opName);
        return db.prepare(`
          INSERT INTO packages (name, type, operator_id, data_limit, sms_limit, minutes_limit, price, features)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          r["Paket Adı"] || r["name"] || null,
          r["Tip"] || r["type"] || "m2m",
          op ? op.id : null,
          r["Data (GB)"] || r["data_limit"] || null,
          r["SMS"] || r["sms_limit"] || null,
          r["Dakika"] || r["minutes_limit"] || null,
          r["Fiyat"] || r["price"] || 0,
          r["Özellikler"] || r["features"] || null
        );
      },
      personnel: (r) => {
        return db.prepare(`
          INSERT INTO personnel (first_name, last_name, department, company, cost_center, phone, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          r["Ad"] || r["first_name"] || null,
          r["Soyad"] || r["last_name"] || null,
          r["Departman"] || r["department"] || null,
          r["Şirket"] || r["company"] || null,
          r["Masraf Kalemi"] || r["cost_center"] || null,
          r["Telefon"] || r["phone"] || null,
          r["Notlar"] || r["notes"] || null
        );
      }
    };

    if (!insertFns[type])
      return res.status(400).json({ message: "Geçersiz tip." });

    const insertMany = db.transaction((rows) => {
      rows.forEach((r, i) => {
        try {
          if (type !== 'personnel' && !r["Operatör"] && !r["operator"]) {
            results.errors.push(`Satır ${i + 2}: Operatör zorunludur.`);
            return;
          }
          if (type === 'personnel') {
            const firstName = r["Ad"] || r["first_name"];
            const lastName = r["Soyad"] || r["last_name"];
            if (!firstName || firstName.toString().trim() === "") {
               results.errors.push(`Satır ${i + 2}: Ad zorunludur.`);
               return;
            }
            if (!lastName || lastName.toString().trim() === "") {
               results.errors.push(`Satır ${i + 2}: Soyad zorunludur.`);
               return;
            }
          }
          const pno = r["Telefon No"] || r["phone_no"] || r["Telefon"] || r["phone"] || null;
          if (pno && type !== 'personnel') {
            const exists = db.prepare(`
              SELECT 1 FROM sim_m2m   WHERE phone_no = ? UNION ALL
              SELECT 1 FROM sim_data  WHERE phone_no = ? UNION ALL
              SELECT 1 FROM sim_voice WHERE phone_no = ?
              LIMIT 1
            `).get(pno, pno, pno);
            if (exists) {
              results.errors.push(`Satır ${i + 2}: ${pno} numarası zaten kayıtlı.`);
              return;
            }
          }
          insertFns[type](r);
          results.inserted++;
        } catch (e) {
          results.errors.push(`Satır ${i + 2}: ${e.message}`);
        }
      });
    });
    insertMany(rows);

    logActivity(req, 'IMPORT_EXCEL', 'IMPORT', null, { 
      type, 
      filename: req.file.originalname, 
      count: results.inserted, 
      errorCount: results.errors.length 
    });

    res.json({ message: `${results.inserted} kayıt eklendi.`, ...results });
  } catch (e) {
    res.status(400).json({ message: "Excel okunamadı: " + e.message });
  }
});

/* ─── JSON BULK INSERT (Manuel toplu ekleme) ─── */
// POST /api/import/json/:type  body: { rows: [...] }
router.post("/json/:type", authMiddleware, (req, res) => {
  const type = req.params.type;
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows) || !rows.length)
    return res.status(400).json({ message: "Eklenecek satır bulunamadı." });

  const insertFns = {
    m2m: (r) => {
      const plateNo     = r.plate_no || null;
      const vehicleType = r.vehicle_type || null;
      // Auto-sync to vehicles table
      if (plateNo && plateNo.toString().trim() !== '') {
        db.prepare(`
          INSERT INTO vehicles (plate_no, vehicle_type)
          VALUES (?, ?)
          ON CONFLICT(plate_no) DO UPDATE SET
            vehicle_type = COALESCE(excluded.vehicle_type, vehicle_type)
        `).run(plateNo.toString().trim(), vehicleType);
      }
      return db
        .prepare(
          `INSERT INTO sim_m2m (iccid,phone_no,operator,status,plate_no,vehicle_type,notes) VALUES (?,?,?,?,?,?,?)`,
        )
        .run(
          r.iccid || null,
          r.phone_no || null,
          r.operator || null,
          r.status || 'active',
          plateNo,
          vehicleType,
          r.notes || null,
        );
    },
    data: (r) =>
      db
        .prepare(
          `INSERT INTO sim_data (iccid,phone_no,operator,status,location,notes) VALUES (?,?,?,?,?,?)`,
        )
        .run(
          r.iccid || null,
          r.phone_no || null,
          r.operator || null,
          r.status || "active",
          r.location || null,
          r.notes || null,
        ),
    voice: (r) => {
      const assignedTo = r.assigned_to || null;
      const costCenter = r.cost_center || null;
      const phoneNo = r.phone_no || null;
      
      if (assignedTo && assignedTo.toString().trim() !== '') {
         // Auto-sync personnel cost center
         db.prepare(`
          INSERT INTO personnel (first_name, last_name, department, company, cost_center, phone)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(first_name, last_name) DO UPDATE SET
            cost_center = COALESCE(excluded.cost_center, cost_center)
         `).run(assignedTo.split(' ')[0] || '', assignedTo.split(' ').slice(1).join(' ') || '', r.department, r.assigned_company, costCenter, phoneNo);
      }

      return db
        .prepare(
          `INSERT INTO sim_voice (iccid,phone_no,operator,status,assigned_to,department,assigned_company,notes) VALUES (?,?,?,?,?,?,?,?)`,
        )
        .run(
          r.iccid || null,
          phoneNo,
          r.operator || null,
          r.status || "active",
          assignedTo,
          r.department || null,
          r.assigned_company || null,
          r.notes || null,
        )
    },
    packages: (r) => {
      const opName = r.operator;
      const op = db.prepare('SELECT id FROM operators WHERE name = ?').get(opName);
      return db.prepare(`
        INSERT INTO packages (name, type, operator_id, data_limit, sms_limit, minutes_limit, price, features)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.name || null,
        r.type || "m2m",
        op ? op.id : null,
        r.data_limit || null,
        r.sms_limit || null,
        r.minutes_limit || null,
        r.price || 0,
        r.features || null
      );
    },
    personnel: (r) => {
      return db.prepare(`
        INSERT INTO personnel (first_name, last_name, department, company, cost_center, phone, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        r.first_name || null,
        r.last_name || null,
        r.department || null,
        r.company || null,
        r.cost_center || null,
        r.phone || null,
        r.notes || null
      );
    }
  };

  if (!insertFns[type])
    return res.status(400).json({ message: "Geçersiz tip." });

  let inserted = 0;
  const errors = [];
  const insertMany = db.transaction((rows) => {
    rows.forEach((r, i) => {
      try {
        if (type !== 'personnel' && !r.operator) {
          errors.push(`Satır ${i + 1}: Operatör zorunludur.`);
          return;
        }
        if (type === 'personnel') {
          if (!r.first_name || r.first_name.trim() === "") {
            errors.push(`Satır ${i + 1}: Ad zorunludur.`);
            return;
          }
          if (!r.last_name || r.last_name.trim() === "") {
            errors.push(`Satır ${i + 1}: Soyad zorunludur.`);
            return;
          }
        }
        if (r.phone_no && type !== 'personnel') {
          const exists = db.prepare(`
            SELECT 1 FROM sim_m2m   WHERE phone_no = ? UNION ALL
            SELECT 1 FROM sim_data  WHERE phone_no = ? UNION ALL
            SELECT 1 FROM sim_voice WHERE phone_no = ?
            LIMIT 1
          `).get(r.phone_no, r.phone_no, r.phone_no);
          if (exists) {
            errors.push(`Satır ${i + 1}: ${r.phone_no} numarası zaten kayıtlı.`);
            return;
          }
        }
        insertFns[type](r);
        inserted++;
      } catch (e) {
        errors.push(`Satır ${i + 1}: ${e.message}`);
      }
    });
  });
  insertMany(rows);

  logActivity(req, 'IMPORT_JSON', 'IMPORT', null, { 
    type, 
    count: inserted, 
    errorCount: errors.length 
  });

  res.json({ message: `${inserted} kayıt eklendi.`, inserted, errors });
});

module.exports = router;
