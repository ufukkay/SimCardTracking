const express = require('express');
const router = express.Router();
const db = require('../database/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const upload = multer({ dest: path.join(__dirname, '..', 'data', 'temp_restore') });

// GET /api/system/backup
// Veritabanini guvenli bir sekilde yedekler ve indirir.
router.get('/backup', authMiddleware, adminOnly, async (req, res) => {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const backupFileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
    const backupPath = path.join(dataDir, backupFileName);

    // better-sqlite3 guvenli yedekleme islemi (WAL vb. varsa commitler)
    await db.backup(backupPath);

    res.download(backupPath, 'simcardtracking_backup.db', (err) => {
      if (err) {
        console.error('[Backup] Dosya indirilmeden once hata:', err);
      }
      // Dosya indirildikten sonra sunucudaki gecici yedegi sil
      try {
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
      } catch (cleanupErr) {
        console.error('[Backup] Gecici yedek silinemedi:', cleanupErr);
      }
    });

  } catch (err) {
    console.error('[System] Yedekleme hatasi:', err);
    res.status(500).json({ message: 'Veritabani yedeklenirken sunucu hatasi olustu.' });
  }
});

// POST /api/system/restore
// Veritabani yedegini yukleyerek mevcut sistemi ezer ve veritabani baglantisini yeniden acar.
router.post('/restore', authMiddleware, adminOnly, upload.single('db_file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Lutfen bir yukleme (.db) dosyasi secin.' });
    }

    const uploadedPath = req.file.path;
    const dataDir = path.join(__dirname, '..', 'data');
    const targetDbPath = path.join(dataDir, 'simcardtracking.db');
    const walPath = path.join(dataDir, 'simcardtracking.db-wal');
    const shmPath = path.join(dataDir, 'simcardtracking.db-shm');

    // 1. Yuklenen dosyanin gecerli bir SQLite dosyasi oldugunu kontrol et
    try {
      const Database = require('better-sqlite3');
      const testDb = new Database(uploadedPath, { readonly: true });
      // Basit bir sorgu ile dosyanin gecerli oldugunu dogrula
      testDb.prepare('SELECT count(*) as n FROM sqlite_master').get();
      testDb.close();
    } catch (validationErr) {
      // Gecersiz dosyayi temizle
      try { fs.unlinkSync(uploadedPath); } catch (_) {}
      return res.status(400).json({ 
        message: 'Yuklenen dosya gecerli bir SQLite veritabani degil. Lutfen dogru yedek dosyasini secin.' 
      });
    }

    // 2. Veritabanini guvenlice kapat
    db.safeClose();

    // 3. Eger varsa, WAL ve SHM gecici dosyalarini sil ki veriler karismasin
    try { if (fs.existsSync(walPath)) fs.unlinkSync(walPath); } catch (_) {}
    try { if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath); } catch (_) {}

    // 4. Yuklenen dosyayi mevcut .db uzerine kopyala/tasi
    fs.copyFileSync(uploadedPath, targetDbPath);

    // Yuklenen gecici upload dosyasini sil
    try { fs.unlinkSync(uploadedPath); } catch (_) {}

    // 5. Veritabanini yeniden ac (process.exit yerine!)
    db.reopen();

    console.log('[System] Veritabani basariyla geri yuklendi ve yeniden acildi.');

    // Basari yaniti don
    res.json({ 
      message: 'Veritabani basariyla geri yuklendi! Sayfa yenilendiginde tum veriler guncellenecektir.',
      success: true
    });

  } catch (err) {
    console.error('[System] Geri yukleme hatasi:', err);
    
    // Hata durumunda veritabanini yeniden acmayi dene
    try {
      db.reopen();
      console.log('[System] Hata sonrasi veritabani yeniden acildi.');
    } catch (reopenErr) {
      console.error('[System] Veritabani yeniden acilamadi:', reopenErr);
    }
    
    res.status(500).json({ message: 'Kurtarma islemi sirasinda kritik hata: ' + err.message });
  }
});

module.exports = router;
