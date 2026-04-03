/* ─── M2M HATLAR SAYFASI ─── */
const M2MPage = (() => {
  let editingId   = null;
  let vehicleList = [];   // cached for auto-fill

  function render() {
    document.getElementById('pageTitle').textContent = i18n.t('nav_m2m');
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-secondary" onclick="M2MPage.exportExcel()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span data-i18n="export_excel">${i18n.t('export_excel')}</span>
      </button>
    `;
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title" data-i18n="m2m_list_title">${i18n.t('m2m_list_title')}</span>
          <div id="bulkActionsBar" class="bulk-actions-bar" style="display:none">
            <span id="selectedCount">0 ${i18n.t('selected_count')}</span>
            <div class="bulk-buttons">
              <button class="btn btn-secondary btn-sm" onclick="M2MPage.openBulkEdit()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span data-i18n="bulk_edit">${i18n.t('bulk_edit')}</span>
              </button>
              <button class="btn btn-danger btn-sm" onclick="M2MPage.bulkDel()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                <span data-i18n="bulk_delete">${i18n.t('bulk_delete')}</span>
              </button>
            </div>
          </div>
        </div>
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
                <th data-i18n="col_action">${i18n.t('col_action')}</th>
              </tr>
            </thead>
            <tbody id="m2mTableBody"></tbody>
          </table>
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

  async function load() {
    const search = document.getElementById('m2mSearch')?.value || '';
    const operator = document.getElementById('m2mOpFilter')?.value || '';
    const vehicleType = document.getElementById('m2mTypeFilter')?.value || '';
    const status = document.getElementById('m2mStatusFilter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (operator) params.append('operator', operator);
    if (vehicleType) params.append('vehicle_type', vehicleType);
    if (status) params.append('status', status);
    const qs = params.toString() ? '?' + params.toString() : '';

    const tbody = document.getElementById('m2mTableBody');
    try {
      let rows = await API.getM2M(qs);
      
      const colDefs = {
        'iccid': { label: 'ICCID', getVal: r => r.iccid || '—' },
        'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
        'operator': { label: 'Operatör', getVal: r => r.operator || '—' },
        'package_name': { label: 'Paket', getVal: r => r.package_name || '—' },
        'vehicle_type': { label: 'Araç Tipi', getVal: r => r.vehicle_type || '—' },
        'status': { label: 'Durum', getVal: r => r.status || '—' },
        'plate_no': { label: 'Plaka', getVal: r => r.plate_no || '—' }
      };

      if (!M2MPage.colFilters) M2MPage.colFilters = {};
      const unfilteredRows = rows;
      rows = UI.filterRows(rows, M2MPage.colFilters, colDefs);
      rows = UI.sortRows(rows, M2MPage.colFilters._sort, colDefs);

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="10">${UI.emptyState('🚗', 'M2M hattı bulunamadı', 'Yeni hat eklemek için butona tıklayın.')}</td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map((r, i) => `
        <tr>
          <td style="width:40px"><input type="checkbox" class="row-select" value="${r.id}"></td>
          <td class="td-muted">${i + 1}</td>
          <td class="td-muted" style="font-family:monospace;font-size:12px">${r.iccid || '—'}</td>
          <td>${r.phone_no || '—'}</td>
          <td>${UI.operatorBadge(r.operator)}</td>
          <td class="td-muted" style="font-size:12px">${r.package_name ? `<span class="badge" style="background:var(--bg-secondary);color:var(--text-main)">${r.package_name}</span>` : '—'}</td>
          <td>${r.vehicle_type ? `<span class="badge" style="background:var(--bg-secondary);color:var(--text-main)">${r.vehicle_type}</span>` : '—'}</td>
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.plate_no || '—'}</strong></td>
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
      
      // Selection init
      UI.initSelection('m2mTableBody', 'm2mSelectAll', (ids) => {
        const bar = document.getElementById('bulkActionsBar');
        const countEl = document.getElementById('selectedCount');
        if (ids.length > 0) {
          bar.style.display = 'flex';
          countEl.textContent = `${ids.length} kayıt seçildi`;
        } else {
          bar.style.display = 'none';
        }
      });

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
      // First populate operator selects (needed for pre-fill)
      await UI.fillOperatorSelect(document.getElementById('m2mOperatorSel'));
      // Then populate packages for the operator
      if (row.operator && typeof SettingsPage !== 'undefined') {
        await SettingsPage.onOperatorChange(row.operator, 'm2m', 'm2mPagePkgSel');
      }
      // Then set form values (including package_id)
      UI.setForm('m2mForm', row);
      UI.openModal('m2mModal');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  function onTypeChange(newType) {
    // Sadece görsel geri bildirim için veya gerekirse tip bazlı alanları gizle/göster için kullanılabilir.
    // Şimdilik sadece tip değişimini takip etmek yeterli.
  }

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
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  }

  function del(id, label) {
    UI.confirm(`"${label}" kaydı silinecek. Bu işlem geri alınamaz.`, async () => {
      try {
        await API.deleteM2M(id);
        UI.toast('Kayıt silindi.', 'success');
        load();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  function openBulkEdit() {
    const ids = UI.getSelectedIds('m2mTableBody');
    document.getElementById('m2mBulkForm').reset();
    document.getElementById('bulkSelectedCountText').textContent = ids.length;
    UI.openModal('m2mBulkModal');
  }

  async function saveBulk(e) {
    e.preventDefault();
    const ids = UI.getSelectedIds('m2mTableBody');
    const formData = UI.formData('m2mBulkForm');
    
    // Sadece doldurulan alanları veya __CLEAR__ olanları gönder
    const data = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] === '__CLEAR__') {
        data[key] = null; // Paketi kaldır
      } else if (formData[key]) {
        data[key] = formData[key];
      }
    });

    if (Object.keys(data).length === 0) {
      UI.toast('Güncellenecek herhangi bir alan doldurmadınız.', 'info');
      return;
    }

    const saveBtn = document.getElementById('m2mBulkSaveBtn');
    saveBtn.disabled = true;
    try {
      await API.bulkUpdate('m2m', ids, data);
      UI.toast(`${ids.length} kayıt başarıyla güncellendi.`, 'success');
      UI.closeModal('m2mBulkModal');
      load();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  }

  function bulkDel() {
    const ids = UI.getSelectedIds('m2mTableBody');
    UI.confirm(`Seçilen ${ids.length} kayıt silinecek. Bu işlem geri alınamaz.`, async () => {
      try {
        await API.bulkDelete('m2m', ids);
        UI.toast(`${ids.length} kayıt silindi.`, 'success');
        load();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  async function exportExcel() {
    try {
      const search = document.getElementById('m2mSearch')?.value || '';
      const operator = document.getElementById('m2mOpFilter')?.value || '';
      const vehicleType = document.getElementById('m2mTypeFilter')?.value || '';
      const status = document.getElementById('m2mStatusFilter')?.value || '';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (operator) params.append('operator', operator);
      if (vehicleType) params.append('vehicle_type', vehicleType);
      if (status) params.append('status', status);
      const qs = params.toString() ? '?' + params.toString() : '';

      const rows = await API.getM2M(qs);
      if (!rows.length) return UI.toast('Dışa aktarılacak veri bulunamadı.', 'info');
      if (typeof XLSX === 'undefined') return UI.toast('Excel kütüphanesi yüklenemedi.', 'error');

      const data = rows.map(r => ({
        'ICCID': r.iccid || '',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || r.operator_name || '',
        'Paket': r.package_name || '',
        'Araç Tipi': r.vehicle_type || '',
        'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
        'Plaka': r.plate_no || '',
        'Notlar': r.notes || '',
        'Kayıt Tarihi': new Date(r.created_at).toLocaleString('tr-TR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:22}, {wch:15}, {wch:15}, {wch:20}, {wch:15}, {wch:10}, {wch:15}, {wch:30}, {wch:20}];
      XLSX.utils.book_append_sheet(wb, ws, 'M2M Hatları');
      XLSX.writeFile(wb, `M2M_Hat_Listesi_${new Date().toISOString().slice(0,10)}.xlsx`);
      UI.toast('Excel dosyası indiriliyor...', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  return { render, load, openAdd, openEdit, save, del, openBulkEdit, saveBulk, bulkDel, exportExcel, openTransferFromEdit, onTypeChange };
})();
