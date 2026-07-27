# ==============================================================================
# SimCardTracking - Kurumsal IIS Canlı Güncelleme Script'i
# ==============================================================================
# Bu script, routes/update.js tarafından arka plan process'i olarak çalıştırılır.
# Her adımı data/update-status.json dosyasına yazar (process restart dayanıklı).
#
# Adımlar:
#   1. SQLite veritabanı yedeği (ZIP, tarihli)
#   2. git safe.directory tanımla
#   3. git fetch + git reset --hard origin/main
#   4. npm install --production (yeni bağımlılıklar)
#   5. web.config touch → iisnode AppPool recycle
#   6. Tamamlandı kaydı
# ==============================================================================

param(
    [string]$AppDir = $PSScriptRoot + "\.."
)

$ErrorActionPreference = "Stop"
$AppDir = (Resolve-Path $AppDir).Path

# ─── Durum Dosyası ────────────────────────────────────────────────────────────
$DataDir    = Join-Path $AppDir "data"
$StatusFile = Join-Path $DataDir "update-status.json"
$HistoryFile= Join-Path $DataDir "update-history.json"
$LogFile    = Join-Path $DataDir "update-last.log"

# data klasörünü oluştur (yoksa)
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

# ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
function Write-Status {
    param([string]$Step, [string]$Message, [string]$State = "running", [string]$Error = "")
    $payload = @{
        state     = $State        # running | success | error
        step      = $Step
        message   = $Message
        error     = $Error
        timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        pid       = $PID
    } | ConvertTo-Json -Compress
    Set-Content -Path $StatusFile -Value $payload -Encoding UTF8 -Force
    Add-Content -Path $LogFile -Value "[$((Get-Date -Format 'HH:mm:ss'))] [$Step] $Message" -Encoding UTF8
}

function Write-History {
    param([bool]$Success, [string]$Message, [string]$OldCommit, [string]$NewCommit)
    $history = @()
    if (Test-Path $HistoryFile) {
        try { $history = Get-Content $HistoryFile -Raw | ConvertFrom-Json } catch {}
    }
    if (-not $history) { $history = @() }
    
    $entry = @{
        date      = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        success   = $Success
        message   = $Message
        oldCommit = $OldCommit
        newCommit = $NewCommit
    }
    # Son 20 kaydı tut
    $history = @($entry) + ($history | Select-Object -First 19)
    $history | ConvertTo-Json -Depth 3 | Set-Content -Path $HistoryFile -Encoding UTF8 -Force
}

# ─── GIT Ortam Değişkenleri ───────────────────────────────────────────────────
$env:HOME        = $env:TEMP
$env:USERPROFILE = $env:TEMP
$env:GIT_AUTHOR_NAME     = "SimCardTracking"
$env:GIT_COMMITTER_NAME  = "SimCardTracking"
$env:GIT_AUTHOR_EMAIL    = "system@local"
$env:GIT_COMMITTER_EMAIL = "system@local"

# ─── Log dosyasını sıfırla ────────────────────────────────────────────────────
"=== SimCardTracking Güncelleme Başlıyor ===" | Set-Content -Path $LogFile -Encoding UTF8 -Force
Add-Content -Path $LogFile -Value "Tarih: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Encoding UTF8
Add-Content -Path $LogFile -Value "AppDir: $AppDir" -Encoding UTF8

$OldCommit = ""
$NewCommit = ""

try {
    # ──────────────────────────────────────────────────────────────────────────
    # ADIM 1: Mevcut commit hash'i kaydet
    # ──────────────────────────────────────────────────────────────────────────
    Write-Status -Step "1/5" -Message "Git durumu kontrol ediliyor..."
    try {
        $OldCommit = (git -C $AppDir rev-parse --short HEAD 2>&1).ToString().Trim()
    } catch { $OldCommit = "bilinmiyor" }

    # ──────────────────────────────────────────────────────────────────────────
    # ADIM 2: SQLite Yedek Al
    # ──────────────────────────────────────────────────────────────────────────
    Write-Status -Step "2/5" -Message "Veritabanı yedeği alınıyor..."

    $DbDir  = Join-Path $AppDir "database"
    $BackupDir = Join-Path $DataDir "backups"
    if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

    $DbFiles = @()
    if (Test-Path $DbDir) {
        $DbFiles = Get-ChildItem -Path $DbDir -Filter "*.db" -File
    }
    
    $ZipName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
    $ZipPath = Join-Path $BackupDir $ZipName

    if ($DbFiles.Count -gt 0) {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $zip = [System.IO.Compression.ZipFile]::Open($ZipPath, 'Create')
        foreach ($f in $DbFiles) {
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $f.Name) | Out-Null
        }
        $zip.Dispose()
        Add-Content -Path $LogFile -Value "  Yedek: $ZipPath ($($DbFiles.Count) DB dosyası)" -Encoding UTF8

        # 10'dan fazla yedek varsa en eskisini sil
        $AllBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.zip" | Sort-Object CreationTime
        if ($AllBackups.Count -gt 10) {
            $AllBackups | Select-Object -First ($AllBackups.Count - 10) | Remove-Item -Force
        }
    } else {
        Add-Content -Path $LogFile -Value "  Uyarı: Yedeklenecek .db dosyası bulunamadı." -Encoding UTF8
    }

    # ──────────────────────────────────────────────────────────────────────────
    # ADIM 3: Git Safe Directory + Fetch + Reset
    # ──────────────────────────────────────────────────────────────────────────
    Write-Status -Step "3/5" -Message "GitHub'dan son sürüm çekiliyor..."

    $AppDirGit = $AppDir.Replace('\', '/')
    git config --global --add safe.directory $AppDirGit 2>&1 | Out-Null

    $fetchOut = (git -C $AppDir fetch origin main 2>&1) -join "`n"
    Add-Content -Path $LogFile -Value "  git fetch: $fetchOut" -Encoding UTF8

    $resetOut = (git -C $AppDir reset --hard origin/main 2>&1) -join "`n"
    Add-Content -Path $LogFile -Value "  git reset: $resetOut" -Encoding UTF8

    $NewCommit = (git -C $AppDir rev-parse --short HEAD 2>&1).ToString().Trim()
    Add-Content -Path $LogFile -Value "  Commit: $OldCommit → $NewCommit" -Encoding UTF8

    # ──────────────────────────────────────────────────────────────────────────
    # ADIM 4: npm install (yeni bağımlılıklar için)
    # ──────────────────────────────────────────────────────────────────────────
    Write-Status -Step "4/5" -Message "Bağımlılıklar güncelleniyor (npm install)..."

    $npmOut = (npm install --production --prefix $AppDir 2>&1) -join "`n"
    Add-Content -Path $LogFile -Value "  npm install: $($npmOut | Select-Object -First 3 | Out-String)" -Encoding UTF8

    # ──────────────────────────────────────────────────────────────────────────
    # ADIM 5: web.config touch → iisnode recycle
    # ──────────────────────────────────────────────────────────────────────────
    Write-Status -Step "5/5" -Message "Uygulama yeniden başlatılıyor..."

    $WebConfig = Join-Path $AppDir "web.config"
    if (Test-Path $WebConfig) {
        $content = Get-Content $WebConfig -Raw -Encoding UTF8
        Set-Content -Path $WebConfig -Value $content -Encoding UTF8 -Force
        Add-Content -Path $LogFile -Value "  web.config touch: OK (iisnode recycle tetiklendi)" -Encoding UTF8
    } else {
        Add-Content -Path $LogFile -Value "  Uyarı: web.config bulunamadı (geliştirme ortamı?)" -Encoding UTF8
    }

    # ──────────────────────────────────────────────────────────────────────────
    # BAŞARI
    # ──────────────────────────────────────────────────────────────────────────
    Write-Status -Step "tamam" -Message "Güncelleme başarıyla tamamlandı! ($OldCommit → $NewCommit)" -State "success"
    Write-History -Success $true -Message "Güncelleme tamamlandı" -OldCommit $OldCommit -NewCommit $NewCommit
    Add-Content -Path $LogFile -Value "=== BAŞARILI ===" -Encoding UTF8

} catch {
    $errMsg = $_.Exception.Message
    Write-Status -Step "hata" -Message "Güncelleme başarısız!" -State "error" -Error $errMsg
    Write-History -Success $false -Message $errMsg -OldCommit $OldCommit -NewCommit $NewCommit
    Add-Content -Path $LogFile -Value "=== HATA: $errMsg ===" -Encoding UTF8
    exit 1
}
