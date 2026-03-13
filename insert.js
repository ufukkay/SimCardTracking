const fs = require('fs');
let content = fs.readFileSync('public/js/i18n.js', 'utf8');

const trAdd = `
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
      'search_placeholder_short': 'Ara...',
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
      'tooltip_transfer': 'Tipi Değiştir'
`;

const enAdd = `
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
      'search_placeholder_short': 'Search...',
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
      'tooltip_transfer': 'Change Type'
`;

// Find the line where "en: {" starts
const lines = content.split('\n');
let enIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('en: {')) {
        enIndex = i;
        break;
    }
}

if (enIndex !== -1) {
    // Insert tr before the closing brace of tr
    lines.splice(enIndex - 1, 0, trAdd);
    
    // Find where Sidebar starts in English to insert
    let sidebarIndex = -1;
    for (let i = enIndex; i < lines.length; i++) {
        if (lines[i].includes('// Sidebar')) {
            sidebarIndex = i;
            break;
        }
    }
    
    if (sidebarIndex !== -1) {
        lines.splice(sidebarIndex, 0, enAdd);
    }
    
    fs.writeFileSync('public/js/i18n.js', lines.join('\n'));
    console.log('Successfully updated i18n.js');
} else {
    console.log('Could not find en: {');
}
