const LogsPage = {
  render: async () => {
    const pageContent = document.getElementById('pageContent');
    pageContent.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">İşlem Geçmişi (Son 20 Kayıt)</h3>
          <div class="card-actions" style="display: flex; gap: 10px;">
            <div class="search-input-wrapper" style="position: relative; width: 250px;">
              <input type="text" id="logSearch" class="form-control" data-i18n="search_placeholder" placeholder="${i18n.t('search_placeholder')}" style="padding-right: 35px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <button class="btn btn-secondary" onclick="LogsPage.loadLogs()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span data-i18n="refresh">${i18n.t('refresh')}</span>
            </button>
          </div>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 180px" data-col-key="created_at" data-i18n="col_date">${i18n.t('col_date')}</th>
                <th style="width: 120px" data-col-key="username" data-i18n="col_user">${i18n.t('col_user')}</th>
                <th style="width: 100px" data-col-key="module" data-i18n="col_module">${i18n.t('col_module')}</th>
                <th style="width: 100px" data-col-key="action" data-i18n="col_action">${i18n.t('col_action')}</th>
                <th data-i18n="col_detail">${i18n.t('col_detail')}</th>
              </tr>
            </thead>
            <tbody id="logsTableBody" class="logs-list-view">
              <tr><td colspan="5" style="text-align:center" data-i18n="loading">${i18n.t('loading')}</td></tr>
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
      'iccid': i18n.t('key_iccid'),
      'phone_no': i18n.t('key_phone_no'),
      'plate_no': i18n.t('key_plate_no'),
      'username': i18n.t('key_username') || 'Kullanıcı Adı',
      'role': i18n.t('key_role') || 'Rol',
      'status': i18n.t('key_status'),
      'operator': i18n.t('key_operator'),
      'vehicle_type': i18n.t('key_vehicle_type'),
      'first_name': i18n.t('key_first_name') || 'Ad',
      'last_name': i18n.t('key_last_name') || 'Soyad',
      'category': i18n.t('key_category') || 'Kategori',
      'price': i18n.t('key_price') || 'Fiyat',
      'type': i18n.t('key_type') || 'Tip',
      'filename': i18n.t('key_filename') || 'Dosya Adı',
      'count': i18n.t('key_count') || 'Kayıt Sayısı',
      'errorCount': i18n.t('key_errorCount') || 'Hata Sayısı',
      'reason': i18n.t('key_reason') || 'Sebep',
      'updates': i18n.t('key_updates') || 'Güncellemeler',
      'assigned_to': i18n.t('key_assigned_to'),
      'location': i18n.t('key_location'),
      'notes': i18n.t('key_notes'),
      'fromType': i18n.t('key_fromType'),
      'toType': i18n.t('key_toType'),
      'originalId': i18n.t('key_originalId')
    };

    const moduleTranslations = {
      'M2M': i18n.t('nav_m2m'),
      'DATA': i18n.t('nav_data'),
      'VOICE': i18n.t('nav_voice'),
      'AUTH': i18n.t('nav_auth') || 'Kimlik Doğrulama',
      'USERS': i18n.t('nav_users') || 'Kullanıcılar',
      'PACKAGES': i18n.t('nav_settings'),
      'SETTINGS': i18n.t('nav_settings')
    };

    const actionTranslations = {
      'CREATE': i18n.t('action_CREATE'),
      'UPDATE': i18n.t('action_UPDATE'),
      'DELETE': i18n.t('action_DELETE'),
      'TRANSFER': i18n.t('action_TRANSFER'),
      'LOGIN': i18n.t('action_LOGIN'),
      'LOGOUT': i18n.t('action_LOGOUT'),
      'BULK_UPDATE': i18n.t('action_BULK_UPDATE')
    };

    try {
      const allLogs = await API.getLogs(query);
      
      const colDefs = {
        'created_at': { label: i18n.t('col_date'), getVal: r => new Date(r.created_at).toLocaleString(i18n.getLang() === 'tr' ? 'tr-TR' : 'en-US') },
        'username': { label: i18n.t('col_user'), getVal: r => r.username || 'system' },
        'module': { label: i18n.t('col_module'), getVal: r => moduleTranslations[r.module] || r.module },
        'action': { label: i18n.t('col_action'), getVal: r => actionTranslations[r.action] || r.action }
      };

      let logs = allLogs;
      logs = UI.filterRows(logs, LogsPage.colFilters, colDefs);
      logs = UI.sortRows(logs, LogsPage.colFilters._sort, colDefs);

      if (!logs || logs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center" data-i18n="no_records">${i18n.t('no_records')}</td></tr>`;
        return;
      }

      tableBody.innerHTML = logs.map(log => {
        const date = new Date(log.created_at).toLocaleString(i18n.getLang() === 'tr' ? 'tr-TR' : 'en-US');
        let rawDetails = log.details || '-';
        let detailHtml = rawDetails;
        
        try {
          if (rawDetails.startsWith('{')) {
            const d = JSON.parse(rawDetails);
            detailHtml = Object.entries(d).map(([k, v]) => {
              const label = keyTranslations[k] || i18n.t('key_' + k) || k;
              let value = v;
              if (k === 'status') {
                value = i18n.t('status_' + v) || v;
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
