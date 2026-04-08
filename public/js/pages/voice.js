/* ─── SES HATLAR SAYFASI ─── */
const VoicePage = (() => {
  let editingId = null;
  let personnelCache = []; // for auto-fill

  function render() {
    document.getElementById('pageTitle').textContent = i18n.t('voice_lines');
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-secondary" onclick="VoicePage.exportExcel()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span data-i18n="export_excel">${i18n.t('export_excel')}</span>
      </button>
      <button class="btn btn-primary" onclick="VoicePage.openAdd()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span data-i18n="new_record">${i18n.t('new_record')}</span>
      </button>
    `;
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title" data-i18n="voice_list_title">${i18n.t('voice_list_title')}</span>
          <div id="bulkActionsBar" class="bulk-actions-bar" style="display:none">
            <span id="selectedCount">0 ${i18n.t('selected_count')}</span>
            <div class="bulk-buttons">
              <button class="btn btn-secondary btn-sm" onclick="VoicePage.openBulkEdit()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span data-i18n="bulk_edit">${i18n.t('bulk_edit')}</span>
              </button>
              <button class="btn btn-danger btn-sm" onclick="VoicePage.bulkDel()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                <span data-i18n="bulk_delete">${i18n.t('bulk_delete')}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="filters">
          <input type="text" id="voiceSearch" class="form-control search-input" data-i18n="search_sim_placeholder" placeholder="${i18n.t('search_sim_placeholder')}">
          <select id="voiceOpFilter" class="form-control filter-select">
            <option value="" data-i18n="all_operators">${i18n.t('all_operators')}</option>
          </select>
          <select id="voiceStatusFilter" class="form-control filter-select-sm">
            <option value="" data-i18n="all_statuses">${i18n.t('all_statuses')}</option>
            <option value="active" data-i18n="status_active">${i18n.t('status_active')}</option>
            <option value="spare" data-i18n="status_spare">${i18n.t('status_spare')}</option>
            <option value="passive" data-i18n="status_passive">${i18n.t('status_passive')}</option>
          </select>
          <button class="btn btn-secondary" onclick="VoicePage.load()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/></svg>
            <span data-i18n="refresh">${i18n.t('refresh')}</span>
          </button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:40px"><input type="checkbox" id="voiceSelectAll"></th>
                <th>#</th>
                <th data-i18n="col_iccid">${i18n.t('col_iccid')}</th>
                <th data-i18n="col_phone">${i18n.t('col_phone')}</th>
                <th data-i18n="col_operator">${i18n.t('col_operator')}</th>
                <th data-i18n="col_package">${i18n.t('col_package')}</th>
                <th data-i18n="col_status">${i18n.t('col_status')}</th>
                <th data-i18n="col_assigned_to">${i18n.t('col_assigned_to')}</th>
                <th data-i18n="col_department">${i18n.t('col_department')}</th>
                <th data-i18n="col_company">${i18n.t('col_company')}</th>
                <th data-i18n="col_action">${i18n.t('col_action')}</th>
              </tr>
            </thead>
            <tbody id="voiceTableBody"></tbody>
          </table>
        </div>
      </div>

      <div class="modal-overlay" id="voiceModal">
        <div class="modal" style="max-width:560px">
          <div class="modal-header">
            <span class="modal-title" id="voiceModalTitle" data-i18n="new_record">${i18n.t('new_record')}</span>
            <button class="modal-close" onclick="UI.closeModal('voiceModal')">×</button>
          </div>
          <form class="modal-body" id="voiceForm" onsubmit="VoicePage.save(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" data-i18n="label_sim_type">${i18n.t('label_sim_type')}</label>
                <select name="sim_type" class="form-control" id="voiceTypeSelect" onchange="VoicePage.onTypeChange(this.value)">
                  <option value="m2m" data-i18n="nav_m2m">${i18n.t('nav_m2m')}</option>
                  <option value="data" data-i18n="nav_data">${i18n.t('nav_data')}</option>
                  <option value="voice" selected data-i18n="nav_voice">${i18n.t('nav_voice')}</option>
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
                <select name="operator" class="form-control" id="voiceOperatorSel" required onchange="SettingsPage?.onOperatorChange(this.value, 'voice', 'voicePagePkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_package">${i18n.t('label_package')}</label>
                <select name="package_id" class="form-control" id="voicePagePkgSel">
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
                <label class="form-label" data-i18n="label_assigned_to">${i18n.t('label_assigned_to')}</label>
                <input name="assigned_to" class="form-control" list="personnelList" id="voicePersonnelInput" data-i18n="search_placeholder_short" placeholder="${i18n.t('search_placeholder_short')}" autocomplete="off">
                <datalist id="personnelList"></datalist>
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_department">${i18n.t('label_department')}</label>
                <input name="department" id="voiceDeptInput" class="form-control" placeholder="Muhasebe, IT...">
              </div>
              <div class="form-group">
                <label class="form-label" data-i18n="label_company">${i18n.t('label_company')}</label>
                <input name="assigned_company" id="voiceCompanyInput" class="form-control">
              </div>
              <div class="form-group col-span-2">
                <label class="form-label" data-i18n="label_notes">${i18n.t('label_notes')}</label>
                <textarea name="notes" class="form-control"></textarea>
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('voiceModal')" data-i18n="cancel">${i18n.t('cancel')}</button>
            <button class="btn btn-primary" onclick="document.getElementById('voiceForm').requestSubmit()" id="voiceSaveBtn" data-i18n="save">${i18n.t('save')}</button>
          </div>
        </div>
      </div>

      <!-- Bulk Edit Modal -->
      <div class="modal-overlay" id="voiceBulkModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Toplu Ses Düzenle</span>
            <button class="modal-close" onclick="UI.closeModal('voiceBulkModal')">×</button>
          </div>
          <form class="modal-body" id="voiceBulkForm" onsubmit="VoicePage.saveBulk(event)">
            <p style="margin-bottom:15px; color:var(--text-muted); font-size:13px"><span id="bulkSelectedCountText">0</span> kayıt güncellenecek. Sadece değiştirmek istediğiniz alanları doldurun.</p>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Operatör</label>
                <select name="operator" class="form-control" id="voiceBulkOperatorSel" onchange="SettingsPage?.onOperatorChange(this.value, 'voice', 'voiceBulkPkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Paket (Tarife)</label>
                <select name="package_id" class="form-control" id="voiceBulkPkgSel">
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
              <div class="form-group col-span-2">
                <label class="form-label">Personel</label>
                <input name="assigned_to" class="form-control" list="personnelList" placeholder="Tüm seçilenlere bu personeli ata...">
              </div>
              <div class="form-group">
                <label class="form-label">Departman</label>
                <input name="department" class="form-control" placeholder="Yeni departman...">
              </div>
              <div class="form-group">
                <label class="form-label">Şirket</label>
                <input name="assigned_company" class="form-control" placeholder="Yeni şirket...">
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Notlar</label>
                <input name="notes" class="form-control" placeholder="Tüm seçilenlere bu notu ekle...">
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('voiceBulkModal')">İptal</button>
            <button class="btn btn-primary" onclick="document.getElementById('voiceBulkForm').requestSubmit()" id="voiceBulkSaveBtn">Toplu Güncelle</button>
          </div>
        </div>
      </div>
    `;

    Promise.all([API.getOperators(), API.getPersonnel()]).then(([ops, personnel]) => {
      const filterEl = document.getElementById('voiceOpFilter');
      ops.forEach(o => { filterEl.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
      UI.fillOperatorSelect(document.getElementById('voiceOperatorSel'));
      UI.fillOperatorSelect(document.getElementById('voiceBulkOperatorSel'));
      personnelCache = personnel;
      const dl = document.getElementById('personnelList');
      if (dl) dl.innerHTML = personnel.map(p => `<option value="${p.first_name} ${p.last_name}" data-dept="${p.department||''}" data-company="${p.company||''}">${p.first_name} ${p.last_name}${p.department ? ' – ' + p.department : ''}${p.company ? ' (' + p.company + ')' : ''}</option>`).join('');
    });

    // Auto-fill department/company when personnel is selected
    document.addEventListener('input', (e) => {
      if (e.target.id !== 'voicePersonnelInput') return;
      const val = e.target.value.trim();
      const match = personnelCache.find(p => `${p.first_name} ${p.last_name}`.toLowerCase() === val.toLowerCase());
      if (match) {
        const dept = document.getElementById('voiceDeptInput');
        const comp = document.getElementById('voiceCompanyInput');
        if (dept) dept.value = match.department || '';
        if (comp) comp.value = match.company || '';
      }
    });


    let debounceTimer;
    ['voiceSearch', 'voiceOpFilter', 'voiceStatusFilter'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => VoicePage.load(), 350);
      });
    });
    load();
  }

  async function load() {
    const search = document.getElementById('voiceSearch')?.value || '';
    const operator = document.getElementById('voiceOpFilter')?.value || '';
    const status = document.getElementById('voiceStatusFilter')?.value || '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (operator) params.append('operator', operator);
    if (status) params.append('status', status);
    const qs = params.toString() ? '?' + params.toString() : '';

    const tbody = document.getElementById('voiceTableBody');
    try {
      let rows = await API.getVoice(qs);
      
      const colDefs = {
        'iccid': { label: 'ICCID', getVal: r => r.iccid || '—' },
        'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
        'operator': { label: 'Operatör', getVal: r => r.operator || '—' },
        'package_name': { label: 'Paket', getVal: r => r.package_name || '—' },
        'status': { label: 'Durum', getVal: r => r.status || '—' },
        'assigned_to': { label: 'Personel', getVal: r => r.assigned_to || '—' },
        'department': { label: 'Departman', getVal: r => r.department || '—' },
        'assigned_company': { label: 'Şirket', getVal: r => r.assigned_company || '—' }
      };

      if (!VoicePage.colFilters) VoicePage.colFilters = {};
      const unfilteredRows = rows;
      rows = UI.filterRows(rows, VoicePage.colFilters, colDefs);
      rows = UI.sortRows(rows, VoicePage.colFilters._sort, colDefs);

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="10">${UI.emptyState('📞', 'Ses hattı bulunamadı', 'Yeni hat eklemek için butona tıklayın.')}</td></tr>`;
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
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.assigned_to || '—'}</strong></td>
          <td class="td-muted">${r.department || '—'}</td>
          <td class="td-muted">${r.assigned_company || '—'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-secondary btn-sm btn-icon" title="Geçmiş" onclick="window.openTimeline(${r.id}, 'Ses Hattı Geçmişi: ${r.assigned_to}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </button>

                ${window.AppPerms?.canEdit('voice') ? `
              <button class="btn btn-secondary btn-sm btn-icon" title="Düzenle" onclick="VoicePage.openEdit(${r.id})">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="VoicePage.del(${r.id}, '${r.assigned_to || r.phone_no || 'Bu kayıt'}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>` : '<span class="td-muted" style="font-size:11px">—</span>'}
            </div>
          </td>
        </tr>
      `).join('');
      
      UI.setupTableFilters('voiceTableBody', unfilteredRows, VoicePage.colFilters, colDefs, () => load());

      UI.initSelection('voiceTableBody', 'voiceSelectAll', (ids) => {
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
    document.getElementById('voiceModalTitle').textContent = i18n.t('new_record');
    document.getElementById('voiceForm').reset();
    UI.openModal('voiceModal');
  }


  async function openEdit(id) {
    editingId = id;
    document.getElementById('voiceModalTitle').textContent = 'Ses Hattını Düzenle';
    try {
      const row = await API.get(`/voice/${id}`);
      // 1. Önce operatör listesini doldur (async — DB'den çek)
      await UI.fillOperatorSelect(document.getElementById('voiceOperatorSel'));
      // 2. Sonra operatöre ait paketleri getir
      if (row.operator && typeof SettingsPage !== 'undefined') {
        await SettingsPage.onOperatorChange(row.operator, 'voice', 'voicePagePkgSel');
      }
      // 3. Form alanlarını doldur
      UI.setForm('voiceForm', row);
      // 4. assigned_to alanını elle set et (datalist input'u setForm kaçırabilir)
      const pInput = document.getElementById('voicePersonnelInput');
      if (pInput) pInput.value = row.assigned_to || '';
      UI.openModal('voiceModal');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  function onTypeChange(newType) {
    // Tip değişimi takibi
  }

  function openTransferFromEdit() {
    if (!editingId) return;
    const name = document.querySelector('#voiceForm [name="assigned_to"]')?.value;
    const phone = document.querySelector('#voiceForm [name="phone_no"]')?.value;
    UI.openTransfer(editingId, 'voice', name || phone || 'Ses Hattı');
  }

  async function save(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('voiceSaveBtn');
    saveBtn.disabled = true;
    const data = UI.formData('voiceForm');
    const newType = document.getElementById('voiceTypeSelect').value;

    try {
      if (editingId && newType !== 'voice') {
        const label = data.assigned_to || data.phone_no || 'Ses Hattı';
        UI.confirm(`"${label}" kaydını <strong>${newType.toUpperCase()}</strong> hattına taşımak istediğinize emin misiniz?`, async () => {
          try {
            await API.transferSim(editingId, 'voice', newType);
            UI.toast('Hat tipi başarıyla değiştirildi.', 'success');
            UI.closeModal('voiceModal');
            load();
          } catch (err) { UI.toast(err.message, 'error'); }
        }, { title: 'Hat Tipini Değiştir', icon: '🔄', okText: 'Tipi Değiştir', okClass: 'btn-primary' });
        return;
      }

      if (editingId) { await API.updateVoice(editingId, data); UI.toast('Ses hattı güncellendi.', 'success'); }
      else { await API.addVoice(data); UI.toast('Ses hattı eklendi.', 'success'); }
      UI.closeModal('voiceModal');
      load();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { saveBtn.disabled = false; }
  }

  function del(id, label) {
    UI.confirm(`"${label}" kaydı silinecek. Bu işlem geri alınamaz.`, async () => {
      try { await API.deleteVoice(id); UI.toast('Kayıt silindi.', 'success'); load(); }
      catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  function openBulkEdit() {
    const ids = UI.getSelectedIds('voiceTableBody');
    document.getElementById('voiceBulkForm').reset();
    document.getElementById('bulkSelectedCountText').textContent = ids.length;
    UI.openModal('voiceBulkModal');
  }

  async function saveBulk(e) {
    e.preventDefault();
    const ids = UI.getSelectedIds('voiceTableBody');
    const formData = UI.formData('voiceBulkForm');
    const data = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] === '__CLEAR__') {
        data[key] = null; // Paketi kaldır
      } else if (formData[key]) {
        data[key] = formData[key];
      }
    });
    if (Object.keys(data).length === 0) { UI.toast('Güncellenecek herhangi bir alan doldurmadınız.', 'info'); return; }

    const saveBtn = document.getElementById('voiceBulkSaveBtn');
    saveBtn.disabled = true;
    try {
      await API.bulkUpdate('voice', ids, data);
      UI.toast(`${ids.length} kayıt başarıyla güncellendi.`, 'success');
      UI.closeModal('voiceBulkModal');
      load();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { saveBtn.disabled = false; }
  }

  function bulkDel() {
    const ids = UI.getSelectedIds('voiceTableBody');
    UI.confirm(`Seçilen ${ids.length} kayıt silinecek. Bu işlem geri alınamaz.`, async () => {
      try {
        await API.bulkDelete('voice', ids);
        UI.toast(`${ids.length} kayıt silindi.`, 'success');
        load();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  async function exportExcel() {
    try {
      const search = document.getElementById('voiceSearch')?.value || '';
      const operator = document.getElementById('voiceOpFilter')?.value || '';
      const status = document.getElementById('voiceStatusFilter')?.value || '';
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (operator) params.append('operator', operator);
      if (status) params.append('status', status);
      const qs = params.toString() ? '?' + params.toString() : '';

      const rows = await API.getVoice(qs);
      if (!rows.length) return UI.toast('Dışa aktarılacak veri bulunamadı.', 'info');
      if (typeof XLSX === 'undefined') return UI.toast('Excel kütüphanesi yüklenemedi.', 'error');

      const data = rows.map(r => ({
        'ICCID': r.iccid || '',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || r.operator_name || '',
        'Paket': r.package_name || '',
        'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
        'Personel': r.assigned_to || '',
        'Departman': r.department || '',
        'Şirket': r.assigned_company || '',
        'Notlar': r.notes || '',
        'Kayıt Tarihi': new Date(r.created_at).toLocaleString('tr-TR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:22}, {wch:15}, {wch:15}, {wch:20}, {wch:10}, {wch:25}, {wch:20}, {wch:20}, {wch:30}, {wch:20}];
      XLSX.utils.book_append_sheet(wb, ws, 'Ses Hatları');
      XLSX.writeFile(wb, `Ses_Hat_Listesi_${new Date().toISOString().slice(0,10)}.xlsx`);
      UI.toast('Excel dosyası indiriliyor...', 'success');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  return { render, load, openAdd, openEdit, save, del, openBulkEdit, saveBulk, bulkDel, exportExcel, openTransferFromEdit, onTypeChange };
})();
