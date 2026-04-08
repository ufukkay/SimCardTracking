# SIM Kart Takip Sistemi - Proje Yapısı

Bu belge, **SimCardTracking** projesinin mimarisini, dosya yapısını ve bileşenlerinin işlevlerini açıklamak için oluşturulmuştur.

## 🛠️ Teknoloji Yığını

*   **Backend:** Node.js & Express.js
*   **Veritabanı:** SQLite (Veri yönetimi için `better-sqlite3` kütüphanesi kullanılıyor)
*   **Kimlik Doğrulama:** JWT (JSON Web Token) & bcryptjs
*   **Dosya İşleme:** Excel (`xlsx`), PDF (`pdf-parse`) ve Dosya Yükleme (`multer`)
*   **Frontend:** HTML, CSS, JavaScript (Statik dosyalar üzerinden sunuluyor)

## 📁 Dizin Yapısı ve Dosya Görevleri

### 📂 Ana Dizin (Root)
*   `server.js`: Uygulamanın ana giriş noktası. Express sunucusunu başlatır, middleware'leri yapılandırır ve rotaları (routes) tanımlar.
*   `package.json`: Projenin bağımlılıklarını ve çalıştırılabilir scriptlerini (`start`, `dev`) içerir.
*   `package.json`: Projenin bağımlılıklarını ve çalıştırılabilir scriptlerini (`start`, `dev`) içerir.
*   `web.config` & `deploy-iis.ps1`: IIS (Internet Information Services) üzerinde dağıtım için yapılandırma dosyaları.
*   `data/`: Veritabanı (`simcardtracking.db`) ve geçici sistem dosyaları bu klasördedir.

### 📂 `routes/` (API Rotaları)
Uygulamanın tüm API uç noktaları burada tanımlanmıştır:
*   `auth.js`: Kullanıcı girişi ve yetkilendirme işlemleri.
*   `users.js`: Kullanıcı yönetimi.
*   `sim.js`, `simm2m.js`, `simdata.js`, `simvoice.js`: Farklı SIM kart türlerinin (M2M, Data, Ses) yönetimi.
*   `invoices.js`: Fatura yönetimi, PDF ve Excel'den fatura verisi çekme.
*   `personnel.js`: Personel kayıtları.
*   `vehicles.js`: Araç kayıtları.
*   `locations.js`: Lokasyon yönetimi.
*   `operators.js`: Operatör (Turkcell, Vodafone, etc.) bilgileri.
*   `reports.js`: Raporlama fonksiyonları.
*   `import.js`: Toplu veri içe aktarma (Excel) işlemleri.

### 📂 `database/` (Veritabanı Yönetimi)
*   `db.js`: Veritabanı bağlantısını kurar, tablo şemalarını oluşturur ve veritabanı fonksiyonlarını yönetir.

### 📂 `middleware/` (Ara Yazılımlar)
*   `auth.js`: İsteklerin yetkili olup olmadığını kontrol eden JWT doğrulama mekanizması.
*   `logger.js`: Uygulama içindeki işlemleri (log) kaydeden sistem.

### 📂 `public/` (Frontend - Ön Yüz)
Kullanıcının tarayıcı üzerinden eriştiği tüm arayüz dosyalarını içerir:
*   `index.html`: Ana kontrol paneli (Dashboard) arayüzü.
*   `login.html`: Giriş sayfası.
*   `css/`: Stil dosyaları.
*   `js/`: Frontend mantığı ve API çağrılarını yöneten JavaScript dosyaları.

### 📂 `data/` (Veri Depolama)
*   `simcardtracking.db`: Uygulamanın ana veritabanı.
*   `.db-shm`, `.db-wal`: Veritabanı performans ve işlem günlük dosyaları.

### 📂 `sandbox/` (Deneme Alanı)
*   Geçici test scriptleri, manuel veri düzeltme kodları ve deneme PDF/Excel dosyaları burada saklanır. Bu klasörün içeriği (README.md hariç) git tarafından takip edilmez.

### 📂 `docs/`
*   Proje dokümantasyonu ve görselleri içerir.

## 🚀 Çalıştırma

Projeyi yerel ortamda çalıştırmak için:

```bash
# Gerekli bağımlılıkları yüklemek için (eğer daha önce yapılmadıysa):
npm install

# Geliştirme modunda başlatmak için (nodemon ile):
npm run dev

# Normal modda başlatmak için:
npm start
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.
