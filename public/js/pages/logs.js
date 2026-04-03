const LogsPage = (() => {
  let currentOffset = 0;
  const limit = 20;
  let currentFilters = {
    search: '',
    module: '',
    action: ''
  };

  function render() {
    const pageContent = document.getElementById('pageContent');
    document.getElementById('pageTitle').textContent = i18n.t('nav_logs');
    
    // Topbar Actions
    document.getElementById('topbarActions').innerHTML = `
      <div class="topbar-filters">
        <div class="search-input-wrapper">
          <input type="text" id="logSearch" class="form-control" data-i18n="search_placeholder" placeholder="${i18n.t('search_placeholder')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <button class="btn btn-secondary" onclick="LogsPage.refresh()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          <span data-i18n="refresh">${i18n.t('refresh')}</span>
        </button>
      </div>
    `;

    pageContent.innerHTML = `
      <div class="card log-card">
        <div class="card-header border-bottom-0">
          <div class="header-main">
            <span class="card-description">Sistemdeki tüm kayıt ekleme, güncelleme ve silme işlemlerini buradan takip edebilirsiniz.</span>
          </div>
          <div class="filter-bar">
            <div class="filter-group">
              <label class="filter-label">Modül:</label>
              <select id="moduleFilter" class="form-control filter-select">
                <option value="">Tümü</option>
                <option value="m2m">M2M Hatları</option>
                <option value="data">Data Hatları</option>
                <option value="voice">Ses Hatları</option>
                <option value="invoices">Faturalar</option>
                <option value="personnel">Personel</option>
                <option value="AUTH">Güvenlik (Auth)</option>
                <option value="USERS">Kullanıcılar</option>
                <option value="SETTINGS">Sistem Ayarları</option>
                <option value="PACKAGES">Paketler</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">İşlem:</label>
              <select id="actionFilter" class="form-control filter-select">
                <option value="">Tümü</option>
                <option value="CREATE">Ekleme</option>
                <option value="UPDATE">Güncelleme</option>
                <option value="DELETE">Silme</option>
                <option value="TRANSFER">Hat Taşıma</option>
                <option value="BULK_UPDATE">Toplu Güncelleme</option>
                <option value="IMPORT_EXCEL">Excel Aktarımı</option>
                <option value="IMPORT_JSON">Toplu Kayıt Aktarımı</option>
                <option value="LOGIN">Giriş</option>
                <option value="LOGIN_FAIL">Hatalı Giriş</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table class="data-table log-table">
            <thead>
              <tr>
                <th style="width: 170px">Tarih / Saat</th>
                <th style="width: 130px">Kullanıcı</th>
                <th style="width: 110px">Modül</th>
                <th style="width: 120px">İşlem</th>
                <th>Detaylar</th>
              </tr>
            </thead>
            <tbody id="logsTableBody">
              <tr><td colspan="5" class="td-center loading-text">Loglar yükleniyor...</td></tr>
            </tbody>
          </table>
        </div>
        
        <div class="load-more-container" id="loadMoreContainer">
          <button class="btn btn-muted btn-sm" id="loadMoreBtn" onclick="LogsPage.loadMore()">
            Daha Fazla Yükle
          </button>
        </div>
      </div>
    `;

    // Events
    document.getElementById('logSearch').addEventListener('input', UI.debounce(() => {
      currentFilters.search = document.getElementById('logSearch').value;
      refresh();
    }, 400));

    document.getElementById('moduleFilter').addEventListener('change', (e) => {
      currentFilters.module = e.target.value;
      refresh();
    });

    document.getElementById('actionFilter').addEventListener('change', (e) => {
      currentFilters.action = e.target.value;
      refresh();
    });

    load(true);
  }

  async function load(isReset = false) {
    if (isReset) {
      currentOffset = 0;
      document.getElementById('logsTableBody').innerHTML = '<tr><td colspan="5" class="td-center loading-text">Loglar yükleniyor...</td></tr>';
      document.getElementById('loadMoreContainer').style.display = 'none';
    }

    const params = new URLSearchParams({
      limit: limit,
      offset: currentOffset,
      search: currentFilters.search,
      module: currentFilters.module,
      action: currentFilters.action
    });

    try {
      const logs = await API.getLogs('?' + params.toString());
      const tableBody = document.getElementById('logsTableBody');

      if (isReset) tableBody.innerHTML = '';

      if (logs.length === 0) {
        if (isReset) {
          tableBody.innerHTML = `<tr><td colspan="5" class="td-center empty-logs">${UI.emptyState('📋', 'Henüz bir işlem kaydı bulunamadı.')}</td></tr>`;
        }
        document.getElementById('loadMoreContainer').style.display = 'none';
        return;
      }

      const rowsHtml = logs.map(log => renderLogRow(log)).join('');
      tableBody.insertAdjacentHTML('beforeend', rowsHtml);

      // Show/hide load more
      document.getElementById('loadMoreContainer').style.display = logs.length === limit ? 'flex' : 'none';
      
      currentOffset += logs.length;
    } catch (err) {
      UI.toast('Loglar yüklenirken hata oluştu', 'error');
    }
  }

  function renderLogRow(log) {
    const date = new Date(log.created_at).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    let details = parseDetails(log.details);
    const actionBadge = getActionBadge(log.action);
    const moduleLabel = getModuleLabel(log.module);

    return `
      <tr class="log-row">
        <td class="td-muted">${date}</td>
        <td>
          <div class="user-cell">
            <div class="user-init">${(log.username || 'S').charAt(0).toUpperCase()}</div>
            <span>${log.username || 'Sistem'}</span>
          </div>
        </td>
        <td><span class="badge badge-muted">${moduleLabel}</span></td>
        <td>${actionBadge}</td>
        <td class="td-details">
          <div class="detail-container">
            ${details}
            ${log.target_id ? `<span class="target-id-badge">ID: ${log.target_id}</span>` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  function parseDetails(raw) {
    if (!raw || raw === '-') return '<span class="detail-empty">—</span>';
    try {
      if (raw.startsWith('{')) {
        const d = JSON.parse(raw);
        return Object.entries(d).map(([k, v]) => {
          const label = i18n.t('key_' + k) || k;
          let val = v;
          if (v === null || v === '') val = '<span class="val-null">boş</span>';
          if (k === 'status') val = i18n.t('status_' + v) || v;
          return `<div class="detail-item"><span class="detail-key">${label}:</span> <span class="detail-val">${val}</span></div>`;
        }).join('');
      }
    } catch (e) {}
    return `<span class="detail-raw">${raw}</span>`;
  }

  function getModuleLabel(mod) {
    const map = {
      'm2m': 'M2M', 'data': 'Data', 'voice': 'Ses', 'invoices': 'Fatura',
      'personnel': 'Personel', 'auth': 'Güvenlik', 'users': 'Kullanıcı', 
      'settings': 'Sistem', 'packages': 'Paket'
    };
    return map[(mod || '').toLowerCase()] || mod;
  }

  function getActionBadge(action) {
    const act = (action || '').toUpperCase();
    const map = {
      'CREATE': { cls: 'badge-success', label: 'Ekleme' },
      'UPDATE': { cls: 'badge-info', label: 'Güncelleme' },
      'DELETE': { cls: 'badge-danger', label: 'Silme' },
      'TRANSFER': { cls: 'badge-warning', label: 'Taşıma' },
      'LOGIN': { cls: 'badge-primary', label: 'Giriş' },
      'LOGOUT': { cls: 'badge-muted', label: 'Çıkış' },
      'BULK_UPDATE': { cls: 'badge-info', label: 'Toplu Günc.' },
      'BULK_DELETE': { cls: 'badge-danger', label: 'Toplu Silme' },
      'IMPORT_EXCEL': { cls: 'badge-success', label: 'Excel Aktar.' },
      'IMPORT_JSON': { cls: 'badge-primary', label: 'Veri Aktar.' },
      'LOGIN_FAIL': { cls: 'badge-danger', label: 'Hatalı Giriş' },
      'UPLOAD_INVOICES': { cls: 'badge-success', label: 'Fatura Yükle' }
    };
    const m = map[act] || { cls: 'badge-muted', label: action };
    return `<span class="badge ${m.cls}">${m.label}</span>`;
  }

  function refresh() { load(true); }
  function loadMore() { load(false); }

  return { render, refresh, loadMore };
})();

