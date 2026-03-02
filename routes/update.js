const express = require('express');
const router = express.Router();
const { execSync, exec } = require('child_process');
const path = require('path');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminOnly);

const APP_DIR = path.join(__dirname, '..');

// ─── GET /api/admin/update/status ────────────────────────────────────────────
// Returns current commit hash and whether there's an update available on remote
router.get('/status', (req, res) => {
  try {
    // We must pass -c safe.directory="*" to every git command because the IIS APPPOOL user
    // doesn't have a home directory to store --global configs
    const gitCmd = 'git -c safe.directory="*"';
    
    // Fetch latest from remote (no checkout)
    execSync(`${gitCmd} fetch origin main`, { cwd: APP_DIR, timeout: 15000 });

    const current = execSync(`${gitCmd} rev-parse HEAD`, { cwd: APP_DIR }).toString().trim();
    const remote  = execSync(`${gitCmd} rev-parse origin/main`, { cwd: APP_DIR }).toString().trim();
    const currentShort = current.substring(0, 7);
    const remoteShort  = remote.substring(0, 7);

    // Latest commit message on remote
    const remoteMsg = execSync(`${gitCmd} log origin/main -1 --pretty=format:"%s"`, { cwd: APP_DIR }).toString().trim();
    const remoteDate = execSync(`${gitCmd} log origin/main -1 --pretty=format:"%cr"`, { cwd: APP_DIR }).toString().trim();

    res.json({
      upToDate: current === remote,
      currentCommit: currentShort,
      remoteCommit: remoteShort,
      latestMessage: remoteMsg,
      latestDate: remoteDate,
    });
  } catch (err) {
    res.status(500).json({ message: `Git durumu alınamadı: ${err.message}` });
  }
});

// ─── POST /api/admin/update/apply ────────────────────────────────────────────
// Pulls latest code from GitHub (skips DB files via .gitignore), restarts iisnode
router.post('/apply', (req, res) => {
  try {
    const gitCmd = 'git -c safe.directory="*"';
    
    // Pull latest code — .gitignore protects *.db so no data loss
    const pullOutput = execSync(`${gitCmd} pull origin main`, { cwd: APP_DIR, timeout: 30000 }).toString().trim();

    // Touch web.config to trigger iisnode recycle (IIS deployment)
    const webConfigPath = path.join(APP_DIR, 'web.config');
    try {
      const fs = require('fs');
      const content = fs.readFileSync(webConfigPath, 'utf8');
      fs.writeFileSync(webConfigPath, content, 'utf8');
    } catch (_) { /* web.config may not exist in dev */ }

    res.json({
      success: true,
      message: 'Güncelleme başarıyla uygulandı. Uygulama yeniden başlatılıyor...',
      detail: pullOutput,
    });

    // In dev (non-IIS): restart after short delay
    if (!webConfigPath) {
      setTimeout(() => process.exit(0), 500);
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Güncelleme başarısız: ${err.message}`,
    });
  }
});

module.exports = router;
