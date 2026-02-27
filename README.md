<div align="center">
  <h1>📱 Sim Kart Takip Sistemi</h1>
  <p>Şirket içi M2M, Data ve Ses hatlarının kolay, hızlı ve güvenilir bir şekilde takip edilmesini sağlayan modern web uygulaması.</p>
</div>

<br />

## 🎯 Projenin Amacı

Sim Kart Takip Sistemi, şirketlerin envanterlerinde bulunan **M2M (Makineler Arası İletişim)**, **Data** ve **Ses** hatlarının tek bir merkezden yönetilmesini sağlamak amacıyla geliştirilmiştir.

Bu sistem sayesinde:

- Hangi hat (SIM kart) kime, hangi departmana veya hangi araca tahsis edilmiş kolayca görülebilir.
- ICCID, telefon numarası, operatör bilgisi (Turkcell, Vodafone vb.) ve aktif/pasif durumları listelenebilir, filtrelenebilir.
- Yeni hat kayıtları eklenebilir, mevcut kayıtlar tam ekran modern pencerelerde (modal) düzenlenebilir veya silinebilir.
- Admin veya standart kullanıcı rolleri sayesinde sisteme güvenli (JWT destekli) giriş yapılabilir.

---

## 💻 Kullanılan Teknolojiler

Proje, modern ve yüksek performanslı araçlar kullanılarak hem geliştirici hem de son kullanıcı dostu olacak şekilde tasarlanmıştır:

### Backend (Sunucu Tarafı)

- **Node.js**: Asenkron yapısı ile hızlı ve ölçeklenebilir uygulama altyapısı.
- **Express.js**: Backend REST API yönlendirmelerini ve HTTP isteklerini yönetmek için kullanılan framework.
- **SQLite (better-sqlite3)**: Kurulum gerektirmeyen, hafif, sunucusuz (serverless) çalışan, performans için WAL (Write-Ahead Logging) aktif edilmiş veritabanı.
- **Bcrypt & JWT**: Kullanıcı parolalarını güvenli şekilde şifreleyerek veritabanında saklar ve Token bazlı (JSON Web Token) oturum yönetimi sunar.

### Frontend (İstemci Tarafı)

- **HTML5 & CSS3**: Yenilikçi, responsive (mobil uyumlu) ve sade bir arayüz.
- **Vanilla JavaScript (ES6)**: Herhangi bir ağır framework (React/Vue/Angular) kullanılmadan, saf JavaScript modülleri ile yüksek performans ve hızlı sayfa geçişleri.
- Modern CSS (Flexbox, Grid, Custom Variables) teknikleri sayesinde estetik ve tam ekran `Modal` (pencere) yönetimleri.

---

## 📸 Ekran Görüntüleri

|                                           Giriş Ekranı                                            |                                          Hat Yönetimi Paneli                                          |
| :-----------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------: |
| <img src="https://via.placeholder.com/600x350?text=Giriş+Ekranı" alt="Giriş Ekranı" width="100%"> | <img src="https://via.placeholder.com/600x350?text=Panel+Görünümü" alt="Panel Görünümü" width="100%"> |

_(Not: Görseller temsilidir, projeyi çalıştırdığınızda gerçek ekranları görebilirsiniz.)_

---

## 🚀 Yerel Ortamda Kurulum (Local Development)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/ufukkay/SimCardTracking.git
   ```
2. Proje dizinine girin:
   ```bash
   cd SimCardTracking
   ```
3. Gerekli kütüphaneleri yükleyin:
   ```bash
   npm install
   ```
4. Uygulamayı başlatın:
   ```bash
   npm start
   ```
5. Tarayıcınızı açın ve `http://localhost:3000` adresine gidin.
   - **Varsayılan Kullanıcı:** `admin`
   - **Varsayılan Şifre:** `admin123`

---

## 🌍 IIS Kurulum ve Güncelleme Rehberi

Bu bölüm, uygulamayı bir Windows Server üzerinde IIS (Internet Information Services) aracılığıyla nasıl yayına alacağınızı veya mevcut sürümü nasıl güncelleyeceğinizi anlatır. Uygulama **taşınabilir Node.js** içerdiği için sunucuya Node.js kurmanıza gerek yoktur.

### 🚩 Ön Hazırlık (Gereksinimler)

- **IIS**: Sunucu Yöneticisi üzerinden "Web Server (IIS)" rolünü aktif edin.
- **URL Rewrite & iisnode**: IIS üzerinde Node.js çalıştırabilmek için [URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) ve [iisnode](https://github.com/tjanczuk/iisnode) eklentilerini kurun.

---

### 📥 Seçenek 1: Sıfırdan (Temiz) Kurulum

Eğer ilk kez kurulum yapıyorsanız veya her şeyi sıfırlamak istiyorsanız:

1.  **Klasörü Hazırlayın**: Proje dosyalarını sunucuda bir dizine kopyalayın (Örn: `C:\inetpub\wwwroot\SimCardTracking`).
2.  **İzinleri Tanımlayın (KRİTİK)**:
    - Klasöre sağ tıklayın -> **Özellikler** -> **Güvenlik**.
    - `IIS_IUSRS` grubunu ekleyin ve **Değiştirme (Modify)** yetkisi verin (Veritabanı yazma işlemi için zorunludur).
3.  **IIS Üzerinde Site Oluşturun**:
    - IIS Manager'dan yeni bir site ekleyin ve fiziksel yol olarak proje klasörünü seçin.
    - Uygulama Havuzu (Application Pool) ayarlarından **.NET CLR Version** seçeneğini **No Managed Code** olarak değiştirin.

---

### 🔄 Seçenek 2: Mevcut Sistemi Güncelleme (Update)

Canlıdaki verilerinizi (veritabanını) bozmadan sadece kodları güncellemek için:

1.  **PowerShell'i Yönetici Olarak Açın**: Proje klasörü içinde sağ tıklayıp PowerShell'i başlatın.
2.  **Script'i Çalıştırın**:
    ```powershell
    .\deploy-iis.ps1
    ```
3.  **Yolu Girin**: Script size hedef klasörü soracaktır (Örn: `C:\inetpub\wwwroot\SimCardTracking`).
4.  **İşlem Tamam**: Script; `node_modules`, `bin` ve tüm kodları güncelleyip IIS'i otomatik olarak tetikleyecektir. Veritabanı (`.db`) dosyanız korunur.

---

### ⚠️ Önemli Notlar

- **Veritabanı Yedekleme**: Herhangi bir işlem yapmadan önce `database/simcardtracking.db` dosyasını yedeklemeniz önerilir.
- **Node_modules**: v1.2 ile birlikte tüm kütüphaneler script tarafından kopyalandığı için sunucuda `npm install` yapmanıza gerek kalmamıştır.

---

_Ufuk Kaya tarafından geliştirilmiştir._
