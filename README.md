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

## 🌍 IIS Üzerine Kurulum ve Dağıtım (Deployment)

Projeyi bir Windows Server üzerinde IIS (Internet Information Services) aracılığıyla yayınlamak için aşağıdaki adımları sırasıyla uygulayınız. Mevcut `web.config` dosyası `iisnode` entegrasyonuna hazır olacak şekilde yapılandırılmıştır.

### 1. Gerekli Programların Kurulumu

Sunucunuzda aşağıdaki yazılımların kurulu olduğundan emin olun:

- **Node.js**: [nodejs.org](https://nodejs.org/) adresinden LTS sürümünü kurun.
- **IIS**: Sunucu Yöneticisi (Server Manager) üzerinden "Web Server (IIS)" rolünü aktif edin.
- **URL Rewrite**: [Microsoft URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) eklentisini indirin ve kurun.
- **iisnode**: IIS üzerinde Node.js uygulamalarını çalıştırmak için [iisnode](https://github.com/tjanczuk/iisnode) eklentisini indirin (Sunucu mimarisi genelde x64 olur).

### 2. Dosyaların Sunucuya Aktarılması ve Yüklenmesi

1. Proje dosyalarınızı sunucuda bir dizine kopyalayın (Örn: `C:\inetpub\wwwroot\SimCardTracking`).
2. Komut İstemini (Command Prompt) açarak gerekli npm paketlerini yükleyin:
   ```bash
   cd C:\inetpub\wwwroot\SimCardTracking
   npm install --production
   ```

### 3. Klasör İzinlerinin Ayarlanması (KRİTİK ADIM)

Uygulama SQLite veritabanı kullandığı için ve iisnode log dosyaları oluşturacağı için, IIS kullanıcısına okuma ve yazma izni verilmesi zorunludur:

1. Proje klasörüne (`SimCardTracking`) sağ tıklayıp **Özellikler (Properties)** > **Güvenlik (Security)** sekmesine gidin.
2. **Ekle (Add)...** düğmesine tıklayın. Gelişmiş seçeneklerden sunucunun `IIS_IUSRS` grubunu bularak klasöre ekleyin.
3. `IIS_IUSRS` grubuna **Tam Denetim (Full Control)** veya en azından **Değiştirme (Modify)**, **Okuma (Read)** ve **Yazma (Write)** yetkilerini verip kaydedin.

### 4. IIS Üzerinde Site Oluşturma

- **IIS Yöneticisini (IIS Manager)** açın.
- `Siteler (Sites)` üzerine sağ tıklayıp **Web Sitesi Ekle (Add Website)** öğesini seçin. Dilerseniz mevcut `Default Web Site` altına `Uygulama Ekle` diyerek de ekleyebilirsiniz.
- Fiziksel Yol olarak proje klasörünü seçin. Dosyalar arasındaki `web.config` otomatik olarak algılanacak ve istekleri (API istekleri ve normal sayfalar) doğru bir şekilde `server.js` ve `public` klasörlerine yönlendirecektir.
- Uygulama Havuzu (Application Pool) kısmında çift tıklayarak **.NET CLR Sürümü** seçeneğini **Yönetilen Kod Yok (No Managed Code)** olarak ayarlayın.

Siteyi başlattıktan sonra belirttiğiniz domain veya IP portu üzerinden sisteme `admin` / `admin123` bilgileriyle giriş yapabilirsiniz.

---

## 🆙 Versiyon Güncelleme (v1.1 ve Sonrası)

Sisteme yeni özellikler eklendiğinde (Örn: v1.1 Gelişmiş Raporlar), canlıdaki IIS sunucunuzu güncellemek için şu adımları izleyebilirsiniz:

### Yöntem 1: Deployment Script (Önerilen)

Proje kök dizininde bulunan `deploy-iis.ps1` script'i, sadece gerekli dosyaları (veritabanınızı bozmadan) hedef klasöre kopyalamak için tasarlanmıştır.

1. PowerShell'i yönetici olarak açın.
2. `.\deploy-iis.ps1` komutunu çalıştırın.
3. Hedef yolu (örn: `C:\inetpub\wwwroot\SimCardTracking`) girin.

### Yöntem 2: Manuel Güncelleme

Eğer manuel kopyalamak isterseniz; `public`, `routes`, `middleware`, `database`, `server.js` ve `package.json` dosyalarını hedef klasöre yapıştırın.
**DİKKAT:** Canlıdaki verilerinizin silinmemesi için `database/simcardtracking.db` dosyasını kopyalarken dikkatli olun (üzerine yazmayın).

---

_Ufuk Kaya tarafından geliştirilmiştir._
