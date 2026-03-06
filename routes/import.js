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
      headers: ['ICCID', 'Telefon No', 'Operatör', 'Araç Tipi / Kullanım Amacı', 'Durum', 'Plaka', 'Notlar'],
      example: [
        ['8990011234567890', '05301234567', 'Vodafone', 'Binek',       'active', '34 ABC 001', 'Araç 1'],
        ['8990017654321098', '05301234568', 'Turkcell', 'Yol Kamerası','spare',  '',           'Yedek'],
      ],
      note: 'Durum değerleri: active (Aktif), spare (Yedek), passive (Pasif)\nAraç Tipi / Kullanım Amacı örnekleri: Binek, Çekici, Yol Kamerası, IoT Cihazı, vb. (Cihazın nerede kullanıldığını belirtmek içindir)'
    },
    data: {
      filename: "Data_Sablon.xlsx",
      headers: [
        "ICCID",
        "Telefon No",
        "Operatör",
        "Durum",
        "Lokasyon",
        "Notlar",
      ],
      example: [
        [
          "8990011234567890",
          "05301234567",
          "Vodafone",
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
            r['ICCID'] || null,
            r['Telefon No'] || null,
            r['Operatör'] || null,
            r['Durum'] || 'active',
            plateNo,
            vehicleType,
            r['Notlar'] || null,
          );
      },
      data: (r) =>
        db
          .prepare(
            `INSERT INTO sim_data (iccid,phone_no,operator,status,location,notes) VALUES (?,?,?,?,?,?)`,
          )
          .run(
            r["ICCID"] || null,
            r["Telefon No"] || null,
            r["Operatör"] || null,
            r["Durum"] || "active",
            r["Lokasyon"] || null,
            r["Notlar"] || null,
          ),
      voice: (r) =>
        db
          .prepare(
            `INSERT INTO sim_voice (iccid,phone_no,operator,status,assigned_to,department,assigned_company,notes) VALUES (?,?,?,?,?,?,?,?)`,
          )
          .run(
            r["ICCID"] || null,
            r["Telefon No"] || null,
            r["Operatör"] || null,
            r["Durum"] || "active",
            r["Personel Adı"] || null,
            r["Departman"] || null,
            r["Şirket"] || null,
            r["Notlar"] || null,
          ),
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
      }
    };

    if (!insertFns[type])
      return res.status(400).json({ message: "Geçersiz tip." });

    const insertMany = db.transaction((rows) => {
      rows.forEach((r, i) => {
        try {
          if (!r["Operatör"]) {
            results.errors.push(`Satır ${i + 2}: Operatör zorunludur.`);
            return;
          }
          const pno = r["Telefon No"] || r["phone_no"] || null;
          if (pno) {
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
    voice: (r) =>
      db
        .prepare(
          `INSERT INTO sim_voice (iccid,phone_no,operator,status,assigned_to,department,assigned_company,notes) VALUES (?,?,?,?,?,?,?,?)`,
        )
        .run(
          r.iccid || null,
          r.phone_no || null,
          r.operator || null,
          r.status || "active",
          r.assigned_to || null,
          r.department || null,
          r.assigned_company || null,
          r.notes || null,
        ),
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
      }
    };

  if (!insertFns[type])
    return res.status(400).json({ message: "Geçersiz tip." });

  let inserted = 0;
  const errors = [];
  const insertMany = db.transaction((rows) => {
    rows.forEach((r, i) => {
      try {
        if (!r.operator) {
          errors.push(`Satır ${i + 1}: Operatör zorunludur.`);
          return;
        }
        if (r.phone_no) {
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
