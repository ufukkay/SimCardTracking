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

### 📂 `services/` (İş Mantığı ve Ortak Servisler)
*   `simService.js`: Sınıf tabanlı olan bu servis, tüm SIM rotalarının (M2M, Data, Voice) veritabanı (CRUD) sorgularını, loglama (activity logs) işlemlerini ve sayfalama / SQL Limit işlemlerini merkezden yürütür.
*   `simUtils.js`: Telefon temizleme (`cleanPhone`), Mükerrer Numara Check ve dış lokasyon / personel tablosu senkronizasyon araçları gibi fonksiyonları barındırır.
*   `invoiceMatcher.js`: Faturalar ve mevcut SIM hatlarını eşleştirerek (telefon bazlı) maliyet merkezi atama kontrollerini yapar.

### 📂 `middleware/` (Ara Yazılımlar)
*   `auth.js`: İsteklerin yetkili olup olmadığını kontrol eden JWT doğrulama mekanizması.
*   `logger.js`: Uygulama içindeki işlemleri (log) kaydeden sistem.

### 📂 `public/` (Frontend - Ön Yüz)
Kullanıcının tarayıcı üzerinden eriştiği tüm arayüz dosyalarını içerir:
*   `index.html`: Ana kontrol paneli (Dashboard) arayüzü.
*   `login.html`: Giriş sayfası.
*   `css/style.css`: Tüm UI ve karanlık / dinamik tema sistemini kapsayan ana CSS dosyamız.
*   `js/app.js`: Tüm uygulamanın route mantığını (URL okuma, sayfa div değişimleri) yürüten ana dosya.
*   `js/api.js`: İstekleri `fetch` yardımı ile arka plana proxy'nleyen köprü bileşeni.
*   `js/pages/sim-page-base.js`: Sayfalama (Pagination), toplu listeleme, Excel indirme işlerini standartlaştıran "Base" frontend sınıfıdır. `m2m.js`, `data.js`, `voice.js` dosyaları bu taban koda bağımlı çalışır.
*   `js/pages/`: SIM kart türleri (`m2m.js`, vb.) ve arayüz dosyaları (ayarlar, raporlar vb.) barınır.

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
