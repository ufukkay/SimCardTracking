<div align="center">
  <h1>📱 Sim Kart Takip Sistemi</h1>
  <p>Şirket içi M2M, Data ve Ses hatlarının kolay, hızlı ve güvenilir bir şekilde takip edilmesini sağlayan modern web uygulaması.</p>
  
  [Türkçe](#-türkçe) | [English](#-english) | [Deutsch](#-deutsch) | [Français](#-français) | [Español](#-español)
</div>

---

## 📸 Ekran Görüntüleri / Screenshots

|                              Giriş Ekranı (Login)                              |                            Panel Görünümü (Dashboard)                            |
| :----------------------------------------------------------------------------: | :------------------------------------------------------------------------------: |
| <img src="https://via.placeholder.com/600x350?text=Giriş+Ekranı" width="100%"> | <img src="https://via.placeholder.com/600x350?text=Panel+Görünümü" width="100%"> |

---

## 🆕 Versiyon 1.6 - Yenilikler & Mimari Refactoring

- **Modüler Servis Mimarisi (Backend):** M2M, Data ve Ses hatlarındaki tüm veritabanı CRUD (Ekle/Sil/Güncelle) operasyonları `%90` oranında ortaklaştırılarak tek bir `SimService` yönetimi altına alındı. Hatalar ve log mekanizmaları merkezileştirildi.
- **Server-Side Pagination (Sayfalama):** Tarayıcı kilitlenmelerini engellemek için API rotaları ve tasarımlar güncellendi. SQL sorgularına `LIMIT/OFFSET` eklenerek binlerce kayıt olsa dahi ekranın milisaniyeler içinde (50'şer kayıt olarak) açılması sağlandı. Excel çıktıları ise gizli limit kaldırma algoritmasıyla eskisi gibi tam liste indirilmeye devam ediyor.
- **Ortaklaştırılan Arayüz Sınıfları (Frontend):** Frontend M2M, Data ve Voice sayfalarında yüzlerce satırlık tasarım kod hataları kaldırılarak yeni `SimPageBase` sınıfı oluşturuldu. Bu sayede Excel çıkarma, toplu silme ve UI etkileşimleri merkezi olarak daha hızlı hale geldi.
- **Yardımcı Fonksiyonlar (simUtils):** Numara doğrulama, formatlama ve duplicate/kopyalanan numara arama testleri `simUtils.js` servisine aktarıldı. Otomatik Personel/Lokasyon senkronizasyon mantığı tüm SIM tipleri için standartlaştırıldı.
- **Mükerrer Numara Engelleme:** M2M, Data ve Ses hatları arasında aynı numaranın kaydedilmesi tamamen engellendi.
- **Akıllı Arama Kutusu:** Sayı ile başlayan aramalarda boşluklar otomatik temizlenirken, isim ile aramalarda boşluklara izin veriliyor.

---

## 🇹🇷 Türkçe

### 🎯 Projenin Amacı

Şirket envanterindeki **M2M**, **Data** ve **Ses** hatlarının tek bir merkezden yönetilmesini sağlar. Kimin hangi hattı kullandığını, ICCID bilgilerini ve operatör detaylarını anlık takip edebilirsiniz.

### 🚀 Kurulum

1. `git clone https://github.com/ufukkay/SimCardTracking.git`
2. `npm install`
3. `npm start`

- **Giriş:** `admin` / `admin123`

---

## 🇺🇸 English

### 🎯 Project Purpose

Enables centralized management of **M2M**, **Data**, and **Voice** lines. Track who is using which line, ICCID information, and operator details in real-time.

### 🚀 Setup

1. `git clone https://github.com/ufukkay/SimCardTracking.git`
2. `npm install`
3. `npm start`

- **Login:** `admin` / `admin123`

---

## 🇩🇪 Deutsch

### 🎯 Projektziel

Ermöglicht die zentrale Verwaltung von **M2M-**, **Daten-** und **Sprachleitungen**. Verfolgen Sie in Echtzeit, wer welche Leitung nutzt, ICCID-Informationen und Betreiberdetails.

---

## 🇫🇷 Français

### 🎯 Objectif du projet

Permet une gestion centralisée des lignes **M2M**, **Données** et **Vocales**. Suivez en temps réel qui utilise quelle ligne, les informations ICCID et les détails de l'opérateur.

---

## 🇪🇸 Español

### 🎯 Propósito del Proyecto

Permite la gestión centralizada de líneas **M2M**, **Datos** y **Voz**. Rastree en tiempo real quién está usando qué línea, la información de ICCID y los detalles del operador.

---

## 🌍 IIS Deployment & Details

For advanced setup on Windows Server via IIS, please refer to our [Detailed Guide](file:///c:/Users/ufuk.kaya/Desktop/Projeler/SimCardTracking/README.md).

_Developed by Ufuk Kaya_
