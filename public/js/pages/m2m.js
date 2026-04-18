/* ─── M2M HATLAR SAYFASI ─── */
const M2MPage = (() => {
  let editingId   = null;
  let vehicleList = [];
  let lastRows    = [];   // son yüklenen satırlar (seçili excel için)
  
  // ─── Listen for Global Refresh ───
  UI.on('REFRESH_DATA', () => {
    if (window.App?.currentPage === 'm2m') load();
  });

  function render() {
    document.getElementById('pageTitle').textContent = i18n.t('nav_m2m');
    SimPageBase.setNormalTopbar();
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title" data-i18n="m2m_list_title">${i18n.t('m2m_list_title')}</span>
        </div>
        <div id="m2mStats" class="stat-strip"></div>
        <div class="filters">
          <input type="text" id="m2mSearch" class="form-control search-input" data-i18n="search_sim_placeholder" placeholder="${i18n.t('search_sim_placeholder')}">
          <select id="m2mOpFilter" class="form-control" style="width:160px">
            <option value="" data-i18n="all_operators">${i18n.t('all_operators')}</option>
          </select>
          <select id="m2mTypeFilter" class="form-control" style="width:160px">
            <option value="" data-i18n="all_vehicles">${i18n.t('all_vehicles')}</option>
            <option value="Binek">Binek</option>
            <option value="Çekici">Çekici</option>
            <option value="Yol Kamerası">Yol Kamerası</option>
            <option value="IoT Cihazı">IoT Cihazı</option>
          </select>
          <select id="m2mStatusFilter" class="form-control" style="width:140px">
            <option value="" data-i18n="all_statuses">${i18n.t('all_statuses')}</option>
            <option value="active" data-i18n="status_active">${i18n.t('status_active')}</option>
            <option value="spare" data-i18n="status_spare">${i18n.t('status_spare')}</option>
            <option value="passive" data-i18n="status_passive">${i18n.t('status_passive')}</option>
          </select>
          <button class="btn btn-secondary" onclick="M2MPage.load()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/></svg>
            <span data-i18n="refresh">${i18n.t('refresh')}</span>
          </button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px"><input type="checkbox" id="m2mSelectAll"></th>
                <th>#</th>
                <th data-i18n="col_iccid">${i18n.t('col_iccid')}</th>
                <th data-i18n="col_phone">${i18n.t('col_phone')}</th>
                <th data-i18n="col_operator">${i18n.t('col_operator')}</th>
                <th data-i18n="col_package">${i18n.t('col_package')}</th>
                <th data-i18n="col_vehicle_type">${i18n.t('col_vehicle_type')}</th>
                <th data-i18n="col_status">${i18n.t('col_status')}</th>
                <th data-i18n="col_plate">${i18n.t('col_plate')}</th>
                <th data-i18n="col_company">${i18n.t('col_company')}</th>
                <th data-i18n="col_action">${i18n.t('col_action')}</th>
              </tr>
            </thead>
            <tbody id="m2mTableBody"></tbody>
          </table>
          <div id="m2mPagination"></div>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-overlay" id="m2mModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title" id="m2mModalTitle" data-i18n="new_record">${i18n.t('new_record')}</span>
            <button class="modal-close" onclick="UI.closeModal('m2mModal')">×</button>
          </div>
          <form class="modal-body" id="m2mForm" onsubmit="M2MPage.save(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" data-i18n="label_sim_type">${i18n.t('label_sim_type')}</label>
                <select name="sim_type" class="form-control" id="m2mTypeSelect" onchange="M2MPage.onTypeChange(this.value)">
                  <option value="m2m" selected data-i18n="nav_m2m">${i18n.t('nav_m2m')}</option>
                  <option value="data" data-i18n="nav_data">${i18n.t('nav_data')}</option>
                  <option value="voice" data-i18n="nav_voice">${i18n.t('nav_voice')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_iccid">${i18n.t('label_iccid')}</label>
                <input name="iccid" class="form-control" data-i18n="label_iccid" placeholder="${i18n.t('label_iccid')}">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_phone_no">${i18n.t('label_phone_no')}</label>
                <input name="phone_no" class="form-control" placeholder="05XX XXX XX XX">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_operator">${i18n.t('label_operator')} <span style="color:var(--danger)">*</span></label>
                <select name="operator" class="form-control" id="m2mOperatorSel" required onchange="SettingsPage?.onOperatorChange(this.value, 'm2m', 'm2mPagePkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_package">${i18n.t('label_package')}</label>
                <select name="package_id" class="form-control" id="m2mPagePkgSel">
                  <option value="" data-i18n="select_option">${i18n.t('select_option')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="col_company">${i18n.t('col_company')}</label>
                <input name="company" class="form-control" placeholder="Şirket Adı">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_status">${i18n.t('label_status')}</label>
                <select name="status" class="form-control">
                  <option value="active" data-i18n="status_active">${i18n.t('status_active')}</option>
                  <option value="spare" data-i18n="status_spare">${i18n.t('status_spare')}</option>
                  <option value="passive" data-i18n="status_passive">${i18n.t('status_passive')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_vehicle_type">${i18n.t('label_vehicle_type')}</label>
                <select name="vehicle_type" class="form-control">
                  <option value="" data-i18n="select_option">${i18n.t('select_option')}</option>
                  <option value="Binek" data-i18n="vehicle_type_car">${i18n.t('vehicle_type_car')}</option>
                  <option value="Çekici" data-i18n="vehicle_type_truck">${i18n.t('vehicle_type_truck')}</option>
                  <option value="Yol Kamerası" data-i18n="vehicle_type_camera">${i18n.t('vehicle_type_camera')}</option>
                  <option value="IoT Cihazı" data-i18n="vehicle_type_iot">${i18n.t('vehicle_type_iot')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_plate_no">${i18n.t('label_plate_no')}</label>
                <input name="plate_no" class="form-control" list="vehiclesList" id="m2mPlateInput" data-i18n="search_placeholder_short" placeholder="${i18n.t('search_placeholder_short')}" autocomplete="off">
                <datalist id="vehiclesList"></datalist>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label" data-i18n="label_notes">${i18n.t('label_notes')}</label>
                <textarea name="notes" class="form-control" placeholder="..."></textarea>
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('m2mModal')" data-i18n="cancel">${i18n.t('cancel')}</button>
            <button class="btn btn-primary" onclick="document.getElementById('m2mForm').requestSubmit()" id="m2mSaveBtn" data-i18n="save">${i18n.t('save')}</button>
          </div>
        </div>
      </div>

      <!-- Bulk Edit Modal -->
      <div class="modal-overlay" id="m2mBulkModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Toplu M2M Düzenle</span>
            <button class="modal-close" onclick="UI.closeModal('m2mBulkModal')">×</button>
          </div>
          <form class="modal-body" id="m2mBulkForm" onsubmit="M2MPage.saveBulk(event)">
            <p style="margin-bottom:15px; color:var(--text-muted); font-size:13px"><span id="bulkSelectedCountText">0</span> kayıt güncellenecek. Sadece değiştirmek istediğiniz alanları doldurun.</p>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Operatör</label>
                <select name="operator" class="form-control" id="m2mBulkOperatorSel" onchange="SettingsPage?.onOperatorChange(this.value, 'm2m', 'm2mBulkPkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Paket (Tarife)</label>
                <select name="package_id" class="form-control" id="m2mBulkPkgSel">
                  <option value="">Değiştirme...</option>
                  <option value="__CLEAR__">— Paketi Kaldır —</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Durum</label>
                <select name="status" class="form-control">
                  <option value="">Değiştirme...</option>
                  <option value="active">Aktif</option>
                  <option value="spare">Yedek</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Araç Tipi</label>
                <select name="vehicle_type" class="form-control">
                  <option value="">Değiştirme...</option>
                  <option value="Binek">Binek</option>
                  <option value="Çekici">Çekici</option>
                  <option value="Yol Kamerası">Yol Kamerası</option>
                  <option value="IoT Cihazı">IoT Cihazı</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Şirket</label>
                <input name="company" class="form-control" placeholder="Tüm seçilenlerin şirketini güncelle...">
              </div>
              <div class="form-group">
                <label class="form-label">Notlar</label>
                <input name="notes" class="form-control" placeholder="Tüm seçilenlere bu notu ekle...">
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('m2mBulkModal')">İptal</button>
            <button class="btn btn-primary" onclick="document.getElementById('m2mBulkForm').requestSubmit()" id="m2mBulkSaveBtn">Toplu Güncelle</button>
          </div>
        </div>
      </div>
    `;

    // Fill filters, operator select, and vehicle datalist efficiently
    if (!vehicleList.length) {
      Promise.all([API.getOperators(), API.getVehicles()]).then(([ops, vehicles]) => {
        vehicleList = vehicles;
        renderStaticElements(ops, vehicles);
      });
    } else {
      API.getOperators().then(ops => renderStaticElements(ops, vehicleList));
    }

    function renderStaticElements(ops, vehicles) {
      const filterEl = document.getElementById('m2mOpFilter');
      if (filterEl) {
        filterEl.innerHTML = '<option value="">Tüm Operatörler</option>' + 
          ops.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
      }
      UI.fillOperatorSelect(document.getElementById('m2mOperatorSel'));
      UI.fillOperatorSelect(document.getElementById('m2mBulkOperatorSel'));
      const dl = document.getElementById('vehiclesList');
      if (dl) dl.innerHTML = vehicles.map(v => `<option value="${v.plate_no}">${v.plate_no}${v.vehicle_type ? ' – ' + v.vehicle_type : ''}</option>`).join('');
    }

    // Search and filter events with improved debounce
    let debounceTimer;
    ['m2mSearch', 'm2mOpFilter', 'm2mTypeFilter', 'm2mStatusFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.oninput = () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => M2MPage.load(), 250);
        };
      }
    });

    // Auto-fill Araç Tipi when a plate is selected
    const plateInput = document.getElementById('m2mPlateInput');
    const typeSelect = document.querySelector('#m2mForm select[name="vehicle_type"]');
    if (plateInput && typeSelect) {
      plateInput.oninput = (e) => {
        const val = e.target.value.trim();
        const match = vehicleList.find(v => v.plate_no === val);
        if (match && match.vehicle_type) typeSelect.value = match.vehicle_type;
      };
    }

    load();
  }

  async function load(page = 1) {
    const search = document.getElementById('m2mSearch')?.value || '';
    const operator = document.getElementById('m2mOpFilter')?.value || '';
    const vehicleType = document.getElementById('m2mTypeFilter')?.value || '';
    const status = document.getElementById('m2mStatusFilter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (operator) params.append('operator', operator);
    if (vehicleType) params.append('vehicle_type', vehicleType);
    if (status) params.append('status', status);
    
    // Pagination params
    params.append('page', page);
    params.append('limit', 50);

    const qs = params.toString() ? '?' + params.toString() : '';

    const tbody = document.getElementById('m2mTableBody');
    try {
      const response = await API.getM2M(qs);
      
      // If server returned array (old API) fallback to it, else use paginated structure
      const isPaginated = !Array.isArray(response);
      let rows = isPaginated ? (response.data || []) : response;
      lastRows = rows;


      const colDefs = {
        'iccid': { label: 'ICCID', getVal: r => r.iccid || '—' },
        'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
        'operator': { label: 'Operatör', getVal: r => r.operator || '—' },
        'package_name': { label: 'Paket', getVal: r => r.package_name || '—' },
        'vehicle_type': { label: 'Araç Tipi', getVal: r => r.vehicle_type || '—' },
        'status': { label: 'Durum', getVal: r => r.status || '—' },
        'plate_no': { label: 'Plaka', getVal: r => r.plate_no || '—' },
        'company': { label: 'Şirket', getVal: r => r.company || '—' }
      };

      if (!M2MPage.colFilters) M2MPage.colFilters = {};
      const unfilteredRows = rows;

      // Stat strip
      const statEl = document.getElementById('m2mStats');
      if (statEl) {
        const active = rows.filter(r => r.status === 'active').length;
        const spare  = rows.filter(r => r.status === 'spare').length;
        const passive = rows.filter(r => r.status === 'passive').length;
        statEl.innerHTML = `
          <span class="stat-chip stat-chip-total">Toplam: <strong>${rows.length}</strong></span>
          <span class="stat-chip stat-chip-active">Aktif: <strong>${active}</strong></span>
          ${spare  ? `<span class="stat-chip stat-chip-spare">Yedek: <strong>${spare}</strong></span>` : ''}
          ${passive ? `<span class="stat-chip stat-chip-passive">Pasif: <strong>${passive}</strong></span>` : ''}
        `;
      }

      rows = UI.filterRows(rows, M2MPage.colFilters, colDefs);
      rows = UI.sortRows(rows, M2MPage.colFilters._sort, colDefs);

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="11">
          <div style="text-align:center;padding:40px;color:var(--text-muted)">
            <div style="font-size:40px;margin-bottom:12px">🚗</div>
            <div style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">M2M hattı bulunamadı</div>
            <div style="font-size:12.5px;margin-bottom:16px">Yeni hat eklemek veya toplu içeri aktarmak için butonları kullanın.</div>
            ${window.AppPerms?.canEdit('m2m') ? `<div style="display:flex;gap:8px;justify-content:center">
              <button class="btn btn-primary btn-sm" onclick="M2MPage.openAdd()">+ Yeni Hat Ekle</button>
              <button class="btn btn-secondary btn-sm" onclick="BulkImport.open('m2m', () => M2MPage.load())">Toplu İçeri Aktar</button>
            </div>` : ''}
          </div>
        </td></tr>`;
        document.getElementById('m2mPagination').innerHTML = '';
        return;
      }

      const canEdit = window.AppPerms?.canEdit('m2m');
      tbody.innerHTML = rows.map((r, i) => `
        <tr class="${canEdit ? 'row-clickable' : ''}" data-id="${r.id}">
          <td style="width:40px"><input type="checkbox" class="row-select" value="${r.id}"></td>
          <td class="td-muted">${i + 1}</td>
          <td class="td-muted" style="font-family:monospace;font-size:12px">${r.iccid || '—'}</td>
          <td>${r.phone_no || '—'}</td>
          <td>${UI.operatorBadge(r.operator)}</td>
          <td class="td-muted" style="font-size:12px">${r.package_name ? `<span class="badge" style="background:var(--bg-secondary);color:var(--text-main)">${r.package_name}</span>` : '—'}</td>
          <td>${r.vehicle_type ? `<span class="badge" style="background:var(--bg-secondary);color:var(--text-main)">${r.vehicle_type}</span>` : '—'}</td>
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.plate_no || '—'}</strong></td>
          <td>${r.company || '—'}</td>
            <td>
               <div class="action-buttons">
                 <button class="btn btn-secondary btn-sm btn-icon" title="Geçmiş" onclick="window.openTimeline(${r.id}, 'M2M Geçmişi: ${r.plate_no || r.phone_no}')">
                   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 </button>
 
                 ${window.AppPerms?.canEdit('m2m') ? `
               <button class="btn btn-secondary btn-sm btn-icon" title="Düzenle" onclick="M2MPage.openEdit(${r.id})">
                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
               </button>
               <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="M2MPage.del(${r.id}, '${r.plate_no || r.phone_no || 'Bu kayıt'}')">
                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
               </button>` : '<span class="td-muted" style="font-size:11px">—</span>'}
             </div>
          </td>
        </tr>
      `).join('');
      
      UI.setupTableFilters('m2mTableBody', unfilteredRows, M2MPage.colFilters, colDefs, () => load());

      // Row click to edit
      if (canEdit) {
        tbody.addEventListener('click', (e) => {
          if (e.target.closest('button, input, label, .btn')) return;
          const row = e.target.closest('tr[data-id]');
          if (row) M2MPage.openEdit(parseInt(row.dataset.id));
        });
      }

      // Selection init
      UI.initSelection('m2mTableBody', 'm2mSelectAll', (ids) => {
        if (ids.length > 0) SimPageBase.setBulkTopbar(ids, 'M2MPage', 'm2m');
        else SimPageBase.setNormalTopbar();
      });

      // Render Pagination
      if (isPaginated && response.totalPages > 1) {
        SimPageBase.renderPagination('m2mPagination', response, 'M2MPage.load');
      } else {
        document.getElementById('m2mPagination').innerHTML = '';
      }

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="10" style="color:var(--danger);padding:20px">${err.message}</td></tr>`;
    }
  }

  function openAdd() {
    editingId = null;
    document.getElementById('m2mModalTitle').textContent = i18n.t('new_record');
    document.getElementById('m2mForm').reset();
    UI.openModal('m2mModal');
  }

  async function openEdit(id) {
    editingId = id;
    document.getElementById('m2mModalTitle').textContent = 'M2M Hattını Düzenle';
    try {
      const row = await API.get(`/m2m/${id}`);
      await UI.fillOperatorSelect(document.getElementById('m2mOperatorSel'));
      if (row.operator && typeof SettingsPage !== 'undefined') {
        await SettingsPage.onOperatorChange(row.operator, 'm2m', 'm2mPagePkgSel');
      }
      UI.setForm('m2mForm', row);
      UI.openModal('m2mModal');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  function onTypeChange(newType) {}

  function openTransferFromEdit() {
    if (!editingId) return;
    const plate = document.querySelector('#m2mForm [name="plate_no"]')?.value;
    const phone = document.querySelector('#m2mForm [name="phone_no"]')?.value;
    UI.openTransfer(editingId, 'm2m', plate || phone || 'M2M Hattı');
  }

  async function save(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('m2mSaveBtn');
    saveBtn.disabled = true;
    const data = UI.formData('m2mForm');
    const newType = document.getElementById('m2mTypeSelect').value;

    try {
      if (editingId && newType !== 'm2m') {
        const label = data.plate_no || data.phone_no || 'M2M Hattı';
        UI.confirm(`"${label}" kaydını <strong>${newType.toUpperCase()}</strong> hattına taşımak istediğinize emin misiniz?`, async () => {
          try {
            await API.transferSim(editingId, 'm2m', newType);
            UI.toast('Hat tipi başarıyla değiştirildi.', 'success');
            UI.closeModal('m2mModal');
            load();
          } catch (err) { UI.toast(err.message, 'error'); }
        }, { title: 'Hat Tipini Değiştir', icon: '🔄', okText: 'Tipi Değiştir', okClass: 'btn-primary' });
        return;
      }

      if (editingId) {
        await API.updateM2M(editingId, data);
        UI.toast('M2M hattı güncellendi.', 'success');
      } else {
        await API.addM2M(data);
        UI.toast('M2M hattı eklendi.', 'success');
      }
      UI.closeModal('m2mModal');
      load();
      UI.emit('REFRESH_DATA');
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  }

  const exportMapFn = r => ({
    'ICCID': r.iccid || '',
    'Telefon No': r.phone_no || '',
    'Operatör': r.operator || r.operator_name || '',
    'Paket': r.package_name || '',
    'Araç Tipi': r.vehicle_type || '',
    'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
    'Plaka': r.plate_no || '',
    'Şirket': r.company || '',
    'Notlar': r.notes || '',
    'Kayıt Tarihi': r.created_at ? new Date(r.created_at).toLocaleString('tr-TR') : ''
  });

  const clearSelection = () => SimPageBase.clearSelection('m2mTableBody', 'm2mSelectAll');
  const exportSelectedExcel = () => SimPageBase.exportToExcel(lastRows.filter(r => UI.getSelectedIds('m2mTableBody').includes(r.id)), exportMapFn, 'M2M_Secili', 'M2M');
  const exportExcel = async () => {
    try {
      const search = document.getElementById('m2mSearch')?.value || '';
      const operator = document.getElementById('m2mOpFilter')?.value || '';
      const vehicleType = document.getElementById('m2mTypeFilter')?.value || '';
      const status = document.getElementById('m2mStatusFilter')?.value || '';
      const qs = new URLSearchParams({ search, operator, vehicle_type: vehicleType, status, export: 'true' }).toString();
      
      const response = await API.getM2M(qs ? '?' + qs : '');
      const rows = response.data || response; // support paginated structure
      SimPageBase.exportToExcel(rows, exportMapFn, 'M2M_Hat_Listesi', 'M2M Hatları');
    } catch (err) { UI.toast(err.message, 'error'); }
  };
  
  const del = (id, label) => SimPageBase.del(id, label, API.deleteM2M, () => { load(); UI.emit('REFRESH_DATA'); });
  const openBulkEdit = () => SimPageBase.openBulkEdit('m2mTableBody', 'm2mBulkForm', 'bulkSelectedCountText', 'm2mBulkModal');
  const saveBulk = (e) => SimPageBase.saveBulk(e, 'm2mTableBody', 'm2mBulkForm', 'm2mBulkSaveBtn', 'm2mBulkModal', (ids, data) => API.bulkUpdate('m2m', ids, data), () => { load(); UI.emit('REFRESH_DATA'); });
  const bulkDel = () => SimPageBase.bulkDel('m2mTableBody', (ids) => API.bulkDelete('m2m', ids), () => { load(); UI.emit('REFRESH_DATA'); });

  return { render, load, openAdd, openEdit, save, del, openBulkEdit, saveBulk, bulkDel, exportExcel, exportSelectedExcel, clearSelection, openTransferFromEdit, onTypeChange };
})();
