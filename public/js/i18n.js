/* ─── i18n Altyapısı ─── */
const i18n = (() => {
  const dictionary = {
    tr: {
      // Sidebar
      'nav_m2m': 'M2M Hatları',
      'nav_data': 'Data Hatları',
      'nav_voice': 'Ses Hatları',
      'nav_reports': 'Raporlar',
      'nav_settings': 'Ayarlar',
      'nav_logs': 'İşlem Geçmişi',
      'nav_lines': 'Hatlar',
      'nav_analysis': 'Analiz',
      'nav_system': 'Sistem',

      // Reports Missing specific keys
      'REPORTS_M2M_SUMMARY': 'M2M Hat Özeti',
      'REPORTS_PACKAGE_DIST': 'Paket Dağılımı',
      'col_count': 'Adet',

      // Topbar
      'logout': 'Çıkış',
      'welcome': 'Hoş geldin',

      // Timeline & Logs
      'timeline_title': 'SIM Kart Geçmişi',
      'action_CREATE': 'Kayıt Oluşturuldu',
      'action_UPDATE': 'Kayıt Güncellendi',
      'action_DELETE': 'Kayıt Silindi',
      'action_BULK_UPDATE': 'Toplu Güncelleme',
      'action_TRANSFER': 'Hat Tipi Değiştirildi',
      'action_LOGIN': 'Sisteme Giriş',
      'action_LOGOUT': 'Sistemden Çıkış',
      
      'key_iccid': 'ICCID',
      'key_phone_no': 'Telefon No',
      'key_plate_no': 'Plaka',
      'key_operator': 'Operatör',
      'key_vehicle_type': 'Araç Tipi',
      'key_status': 'Durum',
      'key_package_id': 'Paket ID',
      'key_assigned_to': 'Personel',
      'key_location': 'Lokasyon',
      'key_fromType': 'Eski Tip',
      'key_toType': 'Yeni Tip',

      'status_active': 'Aktif',
      'status_passive': 'Pasif',
      'status_spare': 'Yedek',

      // Common
      'confirm_title': 'Emin misiniz?',
      'confirm_cancel': 'İptal',
      'confirm_ok': 'Tamam',
      'confirm_logout': 'Çıkış yapmak istediğinize emin misiniz?',
      'no_records': 'Henüz kayıt bulunmuyor.',
      'filter_empty': '(Boş)',
      'loading': 'Yükleniyor...',
      'refresh': 'Yenile',
      'search_placeholder': 'Ara...',
      'search_placeholder_short': 'Ara...',
      'search_sim_placeholder': '🔍 Plaka, numara veya ICCID ara...',
      'no_permission': 'Erişim yetkiniz yok',
      'export_excel': 'Excel',
      'selected_count': 'kayıt seçildi',
      'bulk_edit': 'Toplu Düzenle',
      'bulk_delete': 'Toplu Sil',
      'all_operators': 'Tüm Operatörler',
      'all_vehicles': 'Tüm Araç Tipleri',
      'all_statuses': 'Tüm Durumlar',
      'new_record': 'Yeni Kayıt',
      'edit_record': 'Kaydı Düzenle',
      'save': 'Kaydet',
      'cancel': 'İptal',
      'close': 'Kapat',
      'm2m_list_title': 'M2M Hat Listesi',
      'data_list_title': 'Data Hat Listesi',
      'voice_list_title': 'Ses Hat Listesi',
      'voice_lines': 'Ses Hatları',

      // Table Columns
      'col_iccid': 'ICCID',
      'col_phone': 'Telefon No',
      'col_plate': 'Plaka',
      'col_operator': 'Operatör',
      'col_package': 'Paket',
      'col_vehicle_type': 'Araç Tipi',
      'col_status': 'Durum',
      'col_action': 'İşlem',
      'col_date': 'Tarih / Saat',
      'col_user': 'Kullanıcı',
      'col_module': 'Modül',
      'col_detail': 'İşlem Detayı',
      'col_assigned_to': 'Personel',
      'col_department': 'Departman',
      'col_company': 'Şirket',
      'col_location': 'Lokasyon',

      // Modal Labels
      'label_sim_type': 'Hat Tipi',
      'label_iccid': 'ICCID',
      'label_phone_no': 'Telefon Numarası',
      'label_operator': 'Operatör',
      'label_package': 'Paket Seç',
      'label_status': 'Durum',
      'label_vehicle_type': 'Araç Tipi',
      'label_plate_no': 'Plaka',
      'label_notes': 'Notlar',
      'label_assigned_to': 'Personel',
      'label_location': 'Lokasyon',
      'label_department': 'Departman',
      'label_company': 'Şirket',

      // Log Keys
      'key_originalId': 'Kayıt ID',
      'key_notes': 'Notlar',
      'key_vehicle_type': 'Araç Tipi',
      'key_department': 'Departman',
      'key_assigned_company': 'Şirket',
      'key_username': 'Kullanıcı Adı',
      'key_role': 'Rol',
      'key_first_name': 'Ad',
      'key_last_name': 'Soyad',
      'key_category': 'Kategori',
      'key_price': 'Fiyat',
      'key_type': 'Tip',
      'key_filename': 'Dosya Adı',
      'key_count': 'Kayıt Sayısı',
      'key_errorCount': 'Hata Sayısı',
      'key_reason': 'Sebep',
      'key_updates': 'Güncellemeler',

      // Filters & Tooltips
      'filter_all_operators': 'Tüm Operatörler',
      'filter_all_packages': 'Tüm Paketler',
      'filter_all_vehicles': 'Tüm Araç Tipleri',
      'filter_all_locations': 'Tüm Lokasyonlar',
      'filter_all_status': 'Tüm Durumlar',
      'filter': 'Filtrele',
      'sort': 'Sırala',
      'select_all': 'Tümünü Seç',
      'clear_selection': 'Temizle',
      'reset': 'Sıfırla',
      'apply': 'Tamam',
      
      // Select Options
      'select_operator': 'Operatör seçin...',
      'select_option': 'Seçiniz...',
      
      // Vehicle Types
      'vehicle_type_car': 'Binek',
      'vehicle_type_truck': 'Çekici',
      'vehicle_type_camera': 'Yol Kamerası',
      'vehicle_type_iot': 'IoT Cihazı',

      // Roles
      'role_admin': 'Admin Kullanıcı',
      'role_editor': 'Editör',
      'role_viewer': 'İzleyici',

      // Action Tooltips
      'tooltip_edit': 'Düzenle',
      'tooltip_delete': 'Sil',
      'tooltip_history': 'Geçmiş',
      'tooltip_transfer': 'Tipi Değiştir',
      'logout_btn_tooltip': 'Çıkış Yap',
      'theme_toggle_tooltip': 'Temayı Değiştir'
    },
    en: {
      // Sidebar
      'nav_m2m': 'M2M Lines',
      'nav_data': 'Data Lines',
      'nav_voice': 'Voice Lines',
      'nav_reports': 'Reports',
      'nav_settings': 'Settings',
      'nav_logs': 'Activity Logs',
      'nav_lines': 'Lines',
      'nav_analysis': 'Analysis',
      'nav_system': 'System',

      // Topbar
      'logout': 'Logout',
      'welcome': 'Welcome',

      // Timeline & Logs
      'timeline_title': 'SIM Card History',
      'action_CREATE': 'Record Created',
      'action_UPDATE': 'Record Updated',
      'action_DELETE': 'Record Deleted',
      'action_BULK_UPDATE': 'Bulk Updated',
      'action_TRANSFER': 'Line Type Changed',
      'action_LOGIN': 'User Login',
      'action_LOGOUT': 'User Logout',

      'key_iccid': 'ICCID',
      'key_phone_no': 'Phone No',
      'key_plate_no': 'Plate No',
      'key_operator': 'Operator',
      'key_vehicle_type': 'Vehicle Type',
      'key_status': 'Status',
      'key_package_id': 'Package ID',
      'key_assigned_to': 'Personnel',
      'key_location': 'Location',
      'key_fromType': 'From Type',
      'key_toType': 'To Type',

      'status_active': 'Active',
      'status_passive': 'Passive',
      'status_spare': 'Spare',

      // Common
      'confirm_title': 'Are you sure?',
      'confirm_cancel': 'Cancel',
      'confirm_ok': 'OK',
      'confirm_logout': 'Are you sure you want to logout?',
      'no_records': 'No records found yet.',
      'filter_empty': '(Empty)',
      'loading': 'Loading...',
      'refresh': 'Refresh',
      'search_placeholder': 'Search...',
      'search_placeholder_short': 'Search...',
      'search_sim_placeholder': '🔍 Search plate, number or ICCID...',
      'no_permission': 'Access denied',
      'export_excel': 'Excel',
      'selected_count': 'records selected',
      'bulk_edit': 'Bulk Edit',
      'bulk_delete': 'Bulk Delete',
      'all_operators': 'All Operators',
      'all_vehicles': 'All Vehicle Types',
      'all_statuses': 'All Statuses',
      'new_record': 'New Record',
      'edit_record': 'Edit Record',
      'save': 'Save',
      'cancel': 'Cancel',
      'close': 'Close',
      'm2m_list_title': 'M2M Line List',
      'data_list_title': 'Data Line List',
      'voice_list_title': 'Voice Line List',
      'voice_lines': 'Voice Lines',

      // Table Columns
      'col_iccid': 'ICCID',
      'col_phone': 'Phone No',
      'col_plate': 'Plate No',
      'col_operator': 'Operator',
      'col_package': 'Package',
      'col_vehicle_type': 'Vehicle Type',
      'col_status': 'Status',
      'col_action': 'Action',
      'col_date': 'Date / Time',
      'col_user': 'User',
      'col_module': 'Module',
      'col_detail': 'Action Detail',
      'col_assigned_to': 'Personnel',
      'col_department': 'Department',
      'col_company': 'Company',
      'col_location': 'Location',

      // Modal Labels
      'label_sim_type': 'Line Type',
      'label_iccid': 'ICCID',
      'label_phone_no': 'Phone Number',
      'label_operator': 'Operator',
      'label_package': 'Select Package',
      'label_status': 'Status',
      'label_vehicle_type': 'Vehicle Type',
      'label_plate_no': 'Plate No',
      'label_notes': 'Notes',
      'label_assigned_to': 'Personnel',
      'label_location': 'Location',
      'label_department': 'Department',
      'label_company': 'Company',

      // Log Keys
      'key_originalId': 'Record ID',
      'key_notes': 'Notes',
      'key_vehicle_type': 'Vehicle Type',
      'key_department': 'Department',
      'key_assigned_company': 'Company',
      'key_username': 'Username',
      'key_role': 'Role',
      'key_first_name': 'First Name',
      'key_last_name': 'Last Name',
      'key_category': 'Category',
      'key_price': 'Price',
      'key_type': 'Type',
      'key_filename': 'Filename',
      'key_count': 'Record Count',
      'key_errorCount': 'Error Count',
      'key_reason': 'Reason',
      'key_updates': 'Updates',

      // Filters & Tooltips
      'filter_all_operators': 'All Operators',
      'filter_all_packages': 'All Packages',
      'filter_all_vehicles': 'All Vehicle Types',
      'filter_all_locations': 'All Locations',
      'filter_all_status': 'All Statuses',
      'filter': 'Filter',
      'sort': 'Sort',
      'select_all': 'Select All',
      'clear_selection': 'Clear',
      'reset': 'Reset',
      'apply': 'Apply',
      
      // Select Options
      'select_operator': 'Select operator...',
      'select_option': 'Select...',
      
      // Vehicle Types
      'vehicle_type_car': 'Car',
      'vehicle_type_truck': 'Truck',
      'vehicle_type_camera': 'Road Camera',
      'vehicle_type_iot': 'IoT Device',

      // Roles
      'role_admin': 'Admin',
      'role_editor': 'Editor',
      'role_viewer': 'Viewer',

      // Action Tooltips
      'tooltip_edit': 'Edit',
      'tooltip_delete': 'Delete',
      'tooltip_history': 'History',
      'tooltip_transfer': 'Change Type',
      'logout_btn_tooltip': 'Logout',
      'theme_toggle_tooltip': 'Toggle Theme'
    }
  };

  let currentLang = localStorage.getItem('simtrack_lang') || 'tr';

  function t(key) {
    if (!dictionary[currentLang]) return key;
    return dictionary[currentLang][key] || key;
  }

  function setLang(lang) {
    if (!dictionary[lang]) return;
    currentLang = lang;
    localStorage.setItem('simtrack_lang', lang);
    document.documentElement.lang = lang;
    updateUI();
  }

  function updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `lang-${currentLang}`);
    });

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle && window.currentPageTitleKey) {
        pageTitle.textContent = t(window.currentPageTitleKey);
    }
    
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });
  }

  return { t, setLang, getLang: () => currentLang, updateUI };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
} else if (typeof window !== 'undefined') {
  window.i18n = i18n;
}
