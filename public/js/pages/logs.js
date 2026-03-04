const LogsPage = {
  render: async () => {
    const pageContent = document.getElementById('pageContent');
    pageContent.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">İşlem Geçmişi (Son 20 Kayıt)</h3>
          <div class="card-actions" style="display: flex; gap: 10px;">
            <div class="search-input-wrapper" style="position: relative; width: 250px;">
              <input type="text" id="logSearch" class="form-control" placeholder="Ara (Kullanıcı, modül, detay...)" style="padding-right: 35px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <button class="btn btn-secondary" onclick="LogsPage.loadLogs()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Yenile
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 180px" data-col-key="created_at">Tarih / Saat</th>
                <th style="width: 120px" data-col-key="username">Kullanıcı</th>
                <th style="width: 100px" data-col-key="module">Modül</th>
                <th style="width: 100px" data-col-key="action">İşlem</th>
                <th>İşlem Detayı</th>
              </tr>
            </thead>
            <tbody id="logsTableBody" class="logs-list-view">
              <tr><td colspan="5" style="text-align:center">Yükleniyor...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Global search event
    const searchInput = document.getElementById('logSearch');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => LogsPage.loadLogs(), 500);
    });

    await LogsPage.loadLogs();
  },

  loadLogs: async () => {
    const tableBody = document.getElementById('logsTableBody');
    const search = document.getElementById('logSearch').value;

    if (!LogsPage.colFilters) LogsPage.colFilters = {};

    let query = search ? `?search=${encodeURIComponent(search)}` : '';

    const keyTranslations = {
      'iccid': 'ICCID',
      'phone_no': 'Telefon No',
      'plate_no': 'Plaka',
      'username': 'Kullanıcı Adı',
      'role': 'Rol',
      'status': 'Durum',
      'operator': 'Operatör',
      'vehicle_type': 'Araç Tipi',
      'first_name': 'Ad',
      'last_name': 'Soyad',
      'category': 'Kategori',
      'price': 'Fiyat',
      'type': 'Tip',
      'filename': 'Dosya Adı',
      'count': 'Kayıt Sayısı',
      'errorCount': 'Hata Sayısı',
      'reason': 'Sebep',
      'updates': 'Güncellemeler',
      'assigned_to': 'Atanan',
      'location': 'Lokasyon',
      'notes': 'Notlar'
    };

    const moduleTranslations = {
      'M2M': 'M2M Hatları',
      'DATA': 'Data Hatları',
      'VOICE': 'Ses Hatları',
      'AUTH': 'Kimlik Doğrulama',
      'USERS': 'Kullanıcılar',
      'PACKAGES': 'Paketler',
      'PERSONNEL': 'Personel',
      'VEHICLES': 'Araçlar',
      'LOCATIONS': 'Lokasyonlar',
      'OPERATORS': 'Operatörler',
      'IMPORT': 'İçe Aktarma',
      'SETTINGS': 'Ayarlar'
    };

    const actionTranslations = {
      'CREATE': 'EKLEME',
      'UPDATE': 'GÜNCELLEME',
      'DELETE': 'SİLME',
      'LOGIN': 'GİRİŞ',
      'LOGIN_FAIL': 'HATALI GİRİŞ',
      'PASSWORD_CHANGE': 'ŞİFRE DEĞİŞİMİ',
      'BULK_DELETE': 'TOPLU SİLME',
      'BULK_UPDATE': 'TOPLU GÜNCELL.',
      'IMPORT_EXCEL': 'EXCEL AKTAR.',
      'IMPORT_JSON': 'JSON AKTAR.'
    };

    try {
      const allLogs = await API.getLogs(query);
      
      const colDefs = {
        'created_at': { label: 'Tarih / Saat', getVal: r => new Date(r.created_at).toLocaleString('tr-TR') },
        'username': { label: 'Kullanıcı', getVal: r => r.username || 'system' },
        'module': { label: 'Modül', getVal: r => moduleTranslations[r.module] || r.module },
        'action': { label: 'İşlem', getVal: r => actionTranslations[r.action] || r.action }
      };

      let logs = allLogs;
      logs = UI.filterRows(logs, LogsPage.colFilters, colDefs);
      logs = UI.sortRows(logs, LogsPage.colFilters._sort, colDefs);

      if (!logs || logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Kayıt bulunamadı.</td></tr>';
        return;
      }

      tableBody.innerHTML = logs.map(log => {
        const date = new Date(log.created_at).toLocaleString('tr-TR');
        let rawDetails = log.details || '-';
        let detailHtml = rawDetails;
        
        try {
          if (rawDetails.startsWith('{')) {
            const d = JSON.parse(rawDetails);
            detailHtml = Object.entries(d).map(([k, v]) => {
              const label = keyTranslations[k] || k;
              let value = v;
              if (k === 'status') {
                const statusMap = { 'active': 'Aktif', 'passive': 'Pasif', 'spare': 'Yedek' };
                value = statusMap[v] || v;
              }
              return `<strong>${label}:</strong> ${value}`;
            }).join(', ');
          }
        } catch(e) {}

        const actionBadge = LogsPage.getActionBadge(log.action);
        const moduleLabel = moduleTranslations[log.module] || log.module;

        return `
          <tr>
            <td style="color: var(--text-secondary); font-size: 12px;">${date}</td>
            <td><strong>${log.username || 'system'}</strong></td>
            <td><span class="badge badge-muted">${moduleLabel}</span></td>
            <td>${actionBadge}</td>
            <td style="font-size: 13px;">
              <div style="display: flex; flex-direction: column;">
                <span class="detail-text">${detailHtml}</span>
                ${log.target_id ? `<small style="color:var(--text-muted)">ID: ${log.target_id}</small>` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      UI.setupTableFilters('logsTableBody', allLogs, LogsPage.colFilters, colDefs, () => LogsPage.loadLogs());

    } catch (err) {
      UI.toast('Loglar yüklenirken hata oluştu', 'error');
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger)">Hata oluştu.</td></tr>';
    }
  },

  getActionBadge: (action) => {
    let cls = 'badge-muted';
    const actionMap = {
      'CREATE': { cls: 'badge-success', label: 'EKLEME' },
      'UPDATE': { cls: 'badge-info', label: 'GÜNCELLEME' },
      'DELETE': { cls: 'badge-danger', label: 'SİLME' },
      'LOGIN': { cls: 'badge-primary', label: 'GİRİŞ' },
      'LOGIN_FAIL': { cls: 'badge-danger', label: 'HATALI GİRİŞ' },
      'PASSWORD_CHANGE': { cls: 'badge-info', label: 'ŞİFRE DEĞİŞİMİ' },
      'BULK_DELETE': { cls: 'badge-danger', label: 'TOPLU SİLME' },
      'BULK_UPDATE': { cls: 'badge-info', label: 'TOPLU GÜNCELL.' },
      'IMPORT_EXCEL': { cls: 'badge-primary', label: 'EXCEL AKTAR.' },
      'IMPORT_JSON': { cls: 'badge-primary', label: 'JSON AKTAR.' }
    };

    const match = actionMap[action];
    const label = match ? match.label : action;
    const finalCls = match ? match.cls : 'badge-muted';
    
    return `<span class="badge ${finalCls}">${label}</span>`;
  }
};
