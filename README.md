<div align="center">
  <img src="https://via.placeholder.com/120x120?text=SIM" width="120" alt="SIM Card Tracking Logo">
  <h1>📱 Sim Kart Takip Sistemi</h1>
  <p><b>Şirket içi M2M, Data ve Ses hatlarının kolay, hızlı ve güvenilir bir şekilde takip edilmesini sağlayan modern, yüksek performanslı web uygulaması.</b></p>

  ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
  ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

  [Türkçe](#-türkçe) | [English](#-english) | [Deutsch](#-deutsch) | [Français](#-français) | [Español](#-español)
</div>

---

## 📸 Ekran Görüntüleri / Screenshots

| Giriş Ekranı (Login) | Panel Görünümü (Dashboard) |
| :---: | :---: |
| <img src="https://via.placeholder.com/600x350?text=Giriş+Ekranı" width="100%"> | <img src="https://via.placeholder.com/600x350?text=Panel+Görünümü" width="100%"> |

---

## ✨ Öne Çıkan Özellikler / Key Features

- 🚀 **Yüksek Performans & Sayfalama:** `Server-Side Pagination` ve `LIMIT/OFFSET` teknolojisi ile 10.000'lerce SIM kaydı milisaniyeler içerisinde donmadan listelenir.
- 🧱 **Modüler Kurgu:** Yeni entegre edilen `SimService` ve `SimPageBase` sayesinde Frontend/Backend %90 kod tasarrufu ve temiz bir mimari sunar.
- 🔍 **Akıllı Arama ve Çakışma Önleme:** Numara bazlı gelişmiş arama ve M2M/Data/Voice arasında "Mükerrer Numara Kaydı" (Duplicate) engelleme modülü.
- 🛡️ **Rol Yönetimi & Güvenlik:** Sadece yetkili personeller işlem yapabilir. Token bazlı kimlik doğrulama.
- 📊 **Toplu Excel & JSON İçe / Dışa Aktarım:** Yüzlerce satır Excel kayıtları anında hatasız sisteme aktarılabilir. Limitsiz olarak dışarı çıkarılabilir.

---

## 🇹🇷 Türkçe Eğitim / Hızlı Başlangıç

### 🎯 Projenin Amacı
Şirket envanterindeki **M2M**, **Data** ve **Ses** hatlarının tek bir merkezden yönetilmesini sağlar. Hangi lokasyonda/personelde hangi hattın bulunduğunu, ICCID bilgisini, fatura gider merkezini ve operatör datalarını anlık takip edebilirsiniz.

### 🚀 Kurulum

1. Depoyu bilgisayarınıza indirin (Clone):
   ```bash
   git clone https://github.com/ufukkay/SimCardTracking.git
   ```
2. Klasöre girin ve bağımlılıkları yükleyin:
   ```bash
   cd SimCardTracking
   npm install
   ```
3. Uygulamayı başlatın (Geliştirici Modu):
   ```bash
   npm run dev
   ```

- Varsayılan Giriş Adresi: `http://localhost:3000`
- **Demo Giriş:** `admin` / `admin123`

> [!TIP]
> Projenin dosya yapısı, API'lerin görevleri ve veritabanı haritası hakkındaki tüm detaylar için lütfen [PROJE_YAPISI.md](./PROJE_YAPISI.md) dokümanını okuyun.

---

## 🇺🇸 English

### 🎯 Project Purpose
Enables centralized management of **M2M**, **Data**, and **Voice** lines. Track who is using which line, ICCID information, billing cost centers, and operator details in real-time. Fast server-side pagination prevents browser freeze even with thousands of rows.

### 🚀 Setup

1. `git clone https://github.com/ufukkay/SimCardTracking.git`
2. `npm install`
3. `npm start`

- **Login:** `admin` / `admin123`

---

## 🌍 Diğer Diller (Other Languages)

*   **🇩🇪 Deutsch:** Ermöglicht die zentrale Verwaltung von **M2M-**, **Daten-** und **Sprachleitungen**. Verfolgen Sie in Echtzeit, wer welche Leitung nutzt, ICCID-Informationen und Betreiberdetails.
*   **🇫🇷 Français:** Permet une gestion centralisée des lignes **M2M**, **Données** et **Vocales**. Suivez en temps réel qui utilise quelle ligne, les informations ICCID et les détails de l'opérateur.
*   **🇪🇸 Español:** Permite la gestión centralizada de líneas **M2M**, **Datos** y **Voz**. Rastree en tiempo real quién está usando qué línea, la información de ICCID y los detalles del operador.

---

## 🌍 IIS Deployment & Details

For advanced setup on Windows Server via IIS, please refer to our `deploy-iis.ps1` script and `web.config` file within the repository.

_Developed by **Ufuk Kaya**_
