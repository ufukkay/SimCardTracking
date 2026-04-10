/* ─── DATA HATLAR SAYFASI ─── */
const DataPage = (() => {
  let editingId = null;
  
  // ─── Listen for Global Refresh ───
  UI.on('REFRESH_DATA', () => {
    if (window.App?.currentPage === 'data') load();
  });

  function render() {
    document.getElementById('pageTitle').textContent = i18n.t('nav_data');
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-secondary" onclick="DataPage.exportExcel()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span data-i18n="export_excel">${i18n.t('export_excel')}</span>
      </button>
      ${window.AppPerms?.canEdit('data') ? `
      <button class="btn btn-primary" onclick="DataPage.openAdd()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span data-i18n="new_record">${i18n.t('new_record')}</span>
      </button>` : ''}
    `;
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title" data-i18n="data_list_title">${i18n.t('data_list_title')}</span>
          <div id="bulkActionsBar" class="bulk-actions-bar" style="display:none">
            <span id="selectedCount">0 ${i18n.t('selected_count')}</span>
            <div class="bulk-buttons">
              <button class="btn btn-secondary btn-sm" onclick="DataPage.openBulkEdit()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span data-i18n="bulk_edit">${i18n.t('bulk_edit')}</span>
              </button>
              <button class="btn btn-danger btn-sm" onclick="DataPage.bulkDel()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                <span data-i18n="bulk_delete">${i18n.t('bulk_delete')}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="filters">
          <input type="text" id="dataSearch" class="form-control search-input" data-i18n="search_sim_placeholder" placeholder="${i18n.t('search_sim_placeholder')}">
          <select id="dataOpFilter" class="form-control filter-select">
            <option value="" data-i18n="all_operators">${i18n.t('all_operators')}</option>
          </select>
          <select id="dataStatusFilter" class="form-control filter-select-sm">
            <option value="" data-i18n="all_statuses">${i18n.t('all_statuses')}</option>
            <option value="active" data-i18n="status_active">${i18n.t('status_active')}</option>
            <option value="spare" data-i18n="status_spare">${i18n.t('status_spare')}</option>
            <option value="passive" data-i18n="status_passive">${i18n.t('status_passive')}</option>
          </select>
          <button class="btn btn-secondary" onclick="DataPage.load()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/></svg>
            <span data-i18n="refresh">${i18n.t('refresh')}</span>
          </button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px"><input type="checkbox" id="dataSelectAll"></th>
                <th style="width:36px">#</th>
                <th data-i18n="col_iccid">${i18n.t('col_iccid')}</th>
                <th data-i18n="col_phone">${i18n.t('col_phone')}</th>
                <th data-i18n="col_operator">${i18n.t('col_operator')}</th>
                <th data-i18n="col_package">${i18n.t('col_package')}</th>
                <th data-i18n="col_status">${i18n.t('col_status')}</th>
                <th data-i18n="col_location">${i18n.t('col_location')}</th>
                <th data-i18n="col_company">${i18n.t('col_company')}</th>
                <th data-i18n="label_notes">${i18n.t('label_notes')}</th>
                <th style="width:90px" data-i18n="col_action">${i18n.t('col_action')}</th>
              </tr>
            </thead>
            <tbody id="dataTableBody"></tbody>
          </table>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-overlay" id="dataModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title" id="dataModalTitle" data-i18n="new_record">${i18n.t('new_record')}</span>
            <button class="modal-close" onclick="UI.closeModal('dataModal')">×</button>
          </div>
          <form class="modal-body" id="dataForm" onsubmit="DataPage.save(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" data-i18n="label_sim_type">${i18n.t('label_sim_type')}</label>
                <select name="sim_type" id="dataTypeSelect" class="form-control" onchange="DataPage.onTypeChange(this.value)">
                  <option value="m2m" data-i18n="nav_m2m">${i18n.t('nav_m2m')}</option>
                  <option value="data" selected data-i18n="nav_data">${i18n.t('nav_data')}</option>
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
                <select name="operator" class="form-control" id="dataOperatorSel" required onchange="SettingsPage?.onOperatorChange(this.value, 'data', 'dataPagePkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_package">${i18n.t('label_package')}</label>
                <select name="package_id" class="form-control" id="dataPagePkgSel">
                  <option value="" data-i18n="select_option">${i18n.t('select_option')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="col_company">${i18n.t('col_company')}</label>
                <input name="company" class="form-control" placeholder="Şirket Adı">
              </div>
               <div class="form-group">
                <label class="form-label" data-i18n="label_location">${i18n.t('label_location')}</label>
                <input name="location" class="form-control" list="locationsList" id="dataLocInput" data-i18n="search_placeholder_short" placeholder="${i18n.t('search_placeholder_short')}" autocomplete="off">
                <datalist id="locationsList"></datalist>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_status">${i18n.t('label_status')}</label>
                <select name="status" class="form-control">
                  <option value="active" data-i18n="status_active">${i18n.t('status_active')}</option>
                  <option value="spare" data-i18n="status_spare">${i18n.t('status_spare')}</option>
                  <option value="passive" data-i18n="status_passive">${i18n.t('status_passive')}</option>
                </select>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label" data-i18n="label_notes">${i18n.t('label_notes')}</label>
                <textarea name="notes" class="form-control" placeholder="..."></textarea>
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('dataModal')" data-i18n="cancel">${i18n.t('cancel')}</button>
            <button class="btn btn-primary" onclick="document.getElementById('dataForm').requestSubmit()" id="dataSaveBtn" data-i18n="save">${i18n.t('save')}</button>
          </div>
        </div>
      </div>

      <!-- Bulk Edit Modal -->
      <div class="modal-overlay" id="dataBulkModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title" data-i18n="bulk_edit">${i18n.t('bulk_edit')}</span>
            <button class="modal-close" onclick="UI.closeModal('dataBulkModal')">×</button>
          </div>
          <form class="modal-body" id="dataBulkForm" onsubmit="DataPage.saveBulk(event)">
            <p style="margin-bottom:15px; color:var(--text-muted); font-size:13px"><span id="bulkSelectedCountText">0</span> kayıt güncellenecek. Sadece değiştirmek istediğiniz alanları doldurun.</p>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Operatör</label>
                <select name="operator" class="form-control" id="dataBulkOperatorSel" onchange="SettingsPage?.onOperatorChange(this.value, 'data', 'dataBulkPkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Paket (Tarife)</label>
                <select name="package_id" class="form-control" id="dataBulkPkgSel">
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
                <label class="form-label">Lokasyon</label>
                <input name="location" class="form-control" list="locationsList" placeholder="Tüm seçilenlere bu lokasyonu ekle..." autocomplete="off">
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
            <button class="btn btn-secondary" onclick="UI.closeModal('dataBulkModal')">İptal</button>
            <button class="btn btn-primary" onclick="document.getElementById('dataBulkForm').requestSubmit()" id="dataBulkSaveBtn">Toplu Güncelle</button>
          </div>
        </div>
      </div>
    `;

    Promise.all([API.getOperators(), API.getLocations()]).then(([ops, locs]) => {
      const filterEl = document.getElementById('dataOpFilter');
      ops.forEach(o => { filterEl.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
      UI.fillOperatorSelect(document.getElementById('dataOperatorSel'));
      UI.fillOperatorSelect(document.getElementById('dataBulkOperatorSel'));
      const dl = document.getElementById('locationsList');
      if (dl) dl.innerHTML = locs.map(l => `<option value="${l.name}">${l.name}${l.address ? ' – ' + l.address : ''}</option>`).join('');
    });

    let debounceTimer;
    ['dataSearch', 'dataOpFilter', 'dataStatusFilter'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => DataPage.load(), 350);
      });
    });
    load();
  }

  async function load() {
    const search = document.getElementById('dataSearch')?.value || '';
    const operator = document.getElementById('dataOpFilter')?.value || '';
    const status = document.getElementById('dataStatusFilter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (operator) params.append('operator', operator);
    if (status) params.append('status', status);
    const qs = params.toString() ? '?' + params.toString() : '';

    const tbody = document.getElementById('dataTableBody');
    try {
      let rows = await API.getData(qs);
      
      const colDefs = {
        'iccid':      { label: i18n.t('col_iccid'),    getVal: r => r.iccid || '—' },
        'phone_no':   { label: i18n.t('col_phone'),    getVal: r => r.phone_no || '—' },
        'operator':   { label: i18n.t('col_operator'), getVal: r => r.operator || '—' },
        'package_name': { label: i18n.t('col_package'), getVal: r => r.package_name || '—' },
        'status':     { label: i18n.t('col_status'),   getVal: r => r.status || '—' },
        'location':   { label: i18n.t('col_location'), getVal: r => r.location || '—' },
        'company':    { label: i18n.t('col_company'),  getVal: r => r.company || '—' },
        'notes':      { label: i18n.t('label_notes'),  getVal: r => r.notes || '—' }
      };

      if (!DataPage.colFilters) DataPage.colFilters = {};
      const unfilteredRows = rows;
      rows = UI.filterRows(rows, DataPage.colFilters, colDefs);
      rows = UI.sortRows(rows, DataPage.colFilters._sort, colDefs);

      const emptyMsg = i18n.t('no_records');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="10">${UI.emptyState('🌐', emptyMsg)}</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map((r, i) => `
        <tr>
          <td style="width:40px"><input type="checkbox" class="row-select" value="${r.id}"></td>
          <td class="td-muted">${i + 1}</td>
          <td class="td-mono">${r.iccid || '—'}</td>
          <td>${r.phone_no || '—'}</td>
          <td>${UI.operatorBadge(r.operator)}</td>
          <td class="td-muted">${r.package_name ? `<span class="badge badge-package">${r.package_name}</span>` : '—'}</td>
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.location || '—'}</strong></td>
          <td>${r.company || '—'}</td>
          <td class="td-notes">${r.notes || '—'}</td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn btn-secondary btn-sm btn-icon" title="${i18n.t('tooltip_history')}" onclick="window.openTimeline(${r.id}, '${(r.location || r.phone_no || '').replace(/'/g, '&#39;')}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </button>
              ${window.AppPerms?.canEdit('data') ? `
              <button class="btn btn-secondary btn-sm btn-icon" title="${i18n.t('tooltip_edit')}" onclick="DataPage.openEdit(${r.id})">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="${i18n.t('tooltip_delete')}" onclick="DataPage.del(${r.id}, '${(r.location || r.phone_no || 'Bu kayıt').replace(/'/g, '&#39;')}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>` : '<span class="td-muted" style="font-size:11px">—</span>'}
            </div>
          </td>
        </tr>
      `).join('');
      
      UI.setupTableFilters('dataTableBody', unfilteredRows, DataPage.colFilters, colDefs, () => load());

      UI.initSelection('dataTableBody', 'dataSelectAll', (ids) => {
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
      tbody.innerHTML = `<tr><td colspan="9" style="color:var(--danger);padding:20px">${err.message}</td></tr>`;
    }
  }

  function openAdd() {
    editingId = null;
    document.getElementById('dataModalTitle').textContent = i18n.t('new_record');
    document.getElementById('dataForm').reset();
    UI.openModal('dataModal');
  }


  async function openEdit(id) {
    editingId = id;
    document.getElementById('dataModalTitle').textContent = 'Data Hattını Düzenle';
    try {
      const row = await API.get(`/data/${id}`);
      // Populate operator select first
      await UI.fillOperatorSelect(document.getElementById('dataOperatorSel'));
      // Then populate packages for this operator
      if (row.operator && typeof SettingsPage !== 'undefined') {
        await SettingsPage.onOperatorChange(row.operator, 'data', 'dataPagePkgSel');
      }
      // Then pre-fill form (including package_id)
      UI.setForm('dataForm', row);
      UI.openModal('dataModal');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  function onTypeChange(newType) {
    // Tip değişimi takibi
  }

  function openTransferFromEdit() {
    if (!editingId) return;
    const loc = document.querySelector('#dataForm [name="location"]')?.value;
    const phone = document.querySelector('#dataForm [name="phone_no"]')?.value;
    UI.openTransfer(editingId, 'data', loc || phone || 'Data Hattı');
  }

  async function save(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('dataSaveBtn');
    saveBtn.disabled = true;
    const data = UI.formData('dataForm');
    const newType = document.getElementById('dataTypeSelect').value;

    try {
      if (editingId && newType !== 'data') {
        const label = data.location || data.phone_no || 'Data Hattı';
        UI.confirm(`"${label}" kaydını <strong>${newType.toUpperCase()}</strong> hattına taşımak istediğinize emin misiniz?`, async () => {
          try {
            await API.transferSim(editingId, 'data', newType);
            UI.toast('Hat tipi başarıyla değiştirildi.', 'success');
            UI.closeModal('dataModal');
            load();
          } catch (err) { UI.toast(err.message, 'error'); }
        }, { title: 'Hat Tipini Değiştir', icon: '🔄', okText: 'Tipi Değiştir', okClass: 'btn-primary' });
        return;
      }

      if (editingId) { await API.updateData(editingId, data); UI.toast('Data hattı güncellendi.', 'success'); }
      else { await API.addData(data); UI.toast('Data hattı eklendi.', 'success'); }
      UI.closeModal('dataModal');
      load();
      UI.emit('REFRESH_DATA');
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { saveBtn.disabled = false; }
  }

  function del(id, label) {
    UI.confirm(`"${label}" kaydı silinecek. Bu işlem geri alınamaz.`, async () => {
      try { await API.deleteData(id); UI.toast('Kayıt silindi.', 'success'); load(); UI.emit('REFRESH_DATA'); }
      catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  function openBulkEdit() {
    const ids = UI.getSelectedIds('dataTableBody');
    document.getElementById('dataBulkForm').reset();
    document.getElementById('bulkSelectedCountText').textContent = ids.length;
    UI.openModal('dataBulkModal');
  }

  async function saveBulk(e) {
    e.preventDefault();
    const ids = UI.getSelectedIds('dataTableBody');
    const formData = UI.formData('dataBulkForm');
    const data = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] === '__CLEAR__') {
        data[key] = null; // Paketi kaldır
      } else if (formData[key]) {
        data[key] = formData[key];
      }
    });
    if (Object.keys(data).length === 0) { UI.toast('Güncellenecek herhangi bir alan doldurmadınız.', 'info'); return; }

    const saveBtn = document.getElementById('dataBulkSaveBtn');
    saveBtn.disabled = true;
    try {
      await API.bulkUpdate('data', ids, data);
      UI.toast(`${ids.length} kayıt başarıyla güncellendi.`, 'success');
      UI.closeModal('dataBulkModal');
      load();
      UI.emit('REFRESH_DATA');
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { saveBtn.disabled = false; }
  }

  function bulkDel() {
    const ids = UI.getSelectedIds('dataTableBody');
    UI.confirm(`Seçilen ${ids.length} kayıt silinecek. Bu işlem geri alınamaz.`, async () => {
      try {
        await API.bulkDelete('data', ids);
        UI.toast(`${ids.length} kayıt silindi.`, 'success');
        load();
        UI.emit('REFRESH_DATA');
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  async function exportExcel() {
    try {
      const search = document.getElementById('dataSearch')?.value || '';
      const operator = document.getElementById('dataOpFilter')?.value || '';
      const status = document.getElementById('dataStatusFilter')?.value || '';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (operator) params.append('operator', operator);
      if (status) params.append('status', status);
      const qs = params.toString() ? '?' + params.toString() : '';

      const rows = await API.getData(qs);
      if (!rows.length) return UI.toast('Dışa aktarılacak veri bulunamadı.', 'info');
      if (typeof XLSX === 'undefined') return UI.toast('Excel kütüphanesi yüklenemedi.', 'error');

      const data = rows.map(r => ({
        'ICCID': r.iccid || '',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || r.operator_name || '',
        'Paket': r.package_name || '',
        'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
        'Lokasyon': r.location || '',
        'Şirket': r.company || '',
        'Notlar': r.notes || '',
        'Kayıt Tarihi': new Date(r.created_at).toLocaleString('tr-TR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:22}, {wch:15}, {wch:15}, {wch:20}, {wch:10}, {wch:25}, {wch:30}, {wch:20}];
      XLSX.utils.book_append_sheet(wb, ws, 'Data Hatları');
      XLSX.writeFile(wb, `Data_Hat_Listesi_${new Date().toISOString().slice(0,10)}.xlsx`);
      UI.toast('Excel dosyası indiriliyor...', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  return { render, load, openAdd, openEdit, save, del, openBulkEdit, saveBulk, bulkDel, exportExcel, openTransferFromEdit, onTypeChange };
})();
