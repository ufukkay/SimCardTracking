# SIM Takip Sistemi - IIS Deployment Script (v1.2)
# Bu script, geliştirme klasöründeki güncel dosyaları IIS sunucusuna aktarır.

$ErrorActionPreference = "Stop"

# --- Ayarlar ---
# IIS klasörünüzü buraya bir kez yazarsanız her seferinde sormaz.
$DestPath = "C:\inetpub\wwwroot\SimCardTracking" 

if (-not $DestPath) {
    $DestPath = Read-Host "Lütfen IIS uygulama klasör yolunu girin (Örn: C:\inetpub\wwwroot\SimCardTracking)"
}

if (-not (Test-Path $DestPath)) {
    Write-Host "Hata: Hedef klasör bulunamadı: $DestPath" -ForegroundColor Red
    exit
}

Write-Host "--- v1.2 Güncellemesi Başlatılıyor ---" -ForegroundColor Cyan
Write-Host "Hedef: $DestPath"

# 1. Klasörleri ve Dosyaları Listele (Kopyalanacaklar)
$FilesToCopy = @("public", "routes", "middleware", "database", "server.js", "web.config", "package.json", "bin", "node_modules")

# 2. Kopyalama İşlemi
foreach ($item in $FilesToCopy) {
    $src = Join-Path $PSScriptRoot $item
    $dst = Join-Path $DestPath $item
    
    if (Test-Path $src) {
        Write-Host "Kopyalanıyor: $item..."
        if ($item -eq "database") {
            # Veritabanı klasöründe .db dosyasını ezmemek için kontrol (Production verisi kaybolmasın)
            if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
            Get-ChildItem $src | Where-Object { $_.Extension -ne ".db" -and $_.Extension -ne ".db-wal" -and $_.Extension -ne ".db-shm" } | Copy-Item -Destination $dst -Force -Recurse
        } else {
            Copy-Item -Path $src -Destination $DestPath -Force -Recurse
        }
    }
}

# 3. node_modules Kontrolü (Opsiyonel)
Write-Host "`nNot: Eğer yeni bir kütüphane eklendiyse, IIS klasöründe 'npm install' çalıştırmayı unutmayın." -ForegroundColor Yellow

# 4. IIS Uygulamasını Tetikle (web.config'e 'touch' yaparak iisnode'un yeniden başlamasını sağlarız)
$configPath = Join-Path $DestPath "web.config"
if (Test-Path $configPath) {
    (Get-Item $configPath).LastWriteTime = Get-Date
    Write-Host "IIS Uygulaması (iisnode) yeniden başlatma tetiklendi." -ForegroundColor Green
}

Write-Host "`n--- İşlem Başarıyla Tamamlandı! ---" -ForegroundColor Green
Write-Host "Tarayıcıdan kontrol edebilirsiniz."
