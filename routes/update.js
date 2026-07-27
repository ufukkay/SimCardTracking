const express  = require('express');
const router   = express.Router();
const { spawn } = require('child_process');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const { execSync } = require('child_process');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminOnly);

const APP_DIR    = path.join(__dirname, '..');
const DATA_DIR   = path.join(APP_DIR, 'data');
const STATUS_FILE  = path.join(DATA_DIR, 'update-status.json');
const HISTORY_FILE = path.join(DATA_DIR, 'update-history.json');
const LOG_FILE     = path.join(DATA_DIR, 'update-last.log');
const UPDATE_SCRIPT = path.join(APP_DIR, 'deploy', 'update.ps1');

// ─── Git Config Environment ──────────────────────────────────────────────────
// IIS APPPOOL accounts often lack a proper HOME/USERPROFILE directory.
const gitEnv = {
  ...process.env,
  HOME: os.tmpdir(),
  USERPROFILE: os.tmpdir()
};

// data/ klasörü yoksa oluştur
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Ensure this directory is considered safe by Git
try {
  execSync('git config --global --add safe.directory ' + APP_DIR.replace(/\\/g, '/'), { cwd: APP_DIR, env: gitEnv });
} catch (e) {
  console.log('Safe directory setup skipped (expected in dev, non-fatal):', e.message);
}

// ─── Yardımcı: Durum dosyasını oku ──────────────────────────────────────────
function readStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    }
  } catch (_) {}
  return null;
}

// ─── Yardımcı: Son logu oku ──────────────────────────────────────────────────
function readLog() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      return fs.readFileSync(LOG_FILE, 'utf8');
    }
  } catch (_) {}
  return '';
}

// ─── GET /api/admin/update/check ─────────────────────────────────────────────
// GitHub'dan yeni commit olup olmadığını kontrol eder (hızlı, sadece fetch)
router.get('/check', (req, res) => {
  try {
    execSync('git fetch origin main', { cwd: APP_DIR, timeout: 15000, env: gitEnv });

    const current    = execSync('git rev-parse HEAD',         { cwd: APP_DIR, env: gitEnv }).toString().trim();
    const remote     = execSync('git rev-parse origin/main',  { cwd: APP_DIR, env: gitEnv }).toString().trim();
    const remoteMsg  = execSync('git log origin/main -1 --pretty=format:"%s"',  { cwd: APP_DIR, env: gitEnv }).toString().trim();
    const remoteDate = execSync('git log origin/main -1 --pretty=format:"%cr"', { cwd: APP_DIR, env: gitEnv }).toString().trim();

    res.json({
      upToDate:      current === remote,
      currentCommit: current.substring(0, 7),
      remoteCommit:  remote.substring(0, 7),
      latestMessage: remoteMsg,
      latestDate:    remoteDate,
    });
  } catch (err) {
    res.status(500).json({ message: `Git durumu alınamadı: ${err.message}` });
  }
});

// ─── GET /api/admin/update/status ────────────────────────────────────────────
// Devam eden veya son güncellemenin anlık durumunu döner (polling için)
router.get('/status', (req, res) => {
  const status = readStatus();
  const log    = readLog();

  if (!status) {
    return res.json({
      state:   'idle',
      step:    '',
      message: 'Henüz güncelleme başlatılmadı.',
      log:     log,
    });
  }

  res.json({ ...status, log });
});

// ─── GET /api/admin/update/history ───────────────────────────────────────────
// Son güncelleme geçmişini döner
router.get('/history', (req, res) => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      return res.json(Array.isArray(history) ? history : []);
    }
  } catch (_) {}
  res.json([]);
});

// ─── POST /api/admin/update/apply ────────────────────────────────────────────
// update.ps1 scriptini ARKA PLANDA başlatır, hemen 200 döner.
// Frontend /status endpoint'ini polling ile takip eder.
router.post('/apply', (req, res) => {
  // Zaten çalışan bir güncelleme varsa engelle
  const current = readStatus();
  if (current && current.state === 'running') {
    return res.status(409).json({
      success: false,
      message: 'Bir güncelleme zaten devam ediyor. Lütfen bekleyin.',
    });
  }

  // Başlangıç durumu yaz
  const initStatus = {
    state:     'running',
    step:      '0/5',
    message:   'Güncelleme başlatılıyor...',
    error:     '',
    timestamp: new Date().toISOString(),
    pid:       null,
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(initStatus), 'utf8');

  // PowerShell scriptini arka planda spawn et
  const ps = spawn('powershell.exe', [
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', UPDATE_SCRIPT,
    '-AppDir', APP_DIR
  ], {
    detached: true,
    stdio:    'ignore',
    env: {
      ...process.env,
      HOME: os.tmpdir(),
      USERPROFILE: os.tmpdir(),
    }
  });

  ps.unref(); // iisnode parent process'inden bağımsız çalışsın

  // Hemen cevap dön — frontend polling ile takip edecek
  res.json({
    success: true,
    message: 'Güncelleme başlatıldı. Durum için /status endpoint\'ini takip edin.',
    pid:     ps.pid,
  });
});

module.exports = router;
