/* ─── DATA HATLAR SAYFASI ─── */
const DataPage = (() => {
  let editingId = null;

  function render() {
    document.getElementById('pageTitle').textContent = 'Data Hatları';
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-secondary" onclick="DataPage.exportExcel()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Excel'e Aktar
      </button>
    `;
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Data Hat Listesi</span>
          <div id="bulkActionsBar" class="bulk-actions-bar" style="display:none">
            <span id="selectedCount">0 kayıt seçildi</span>
            <div class="bulk-buttons">
              <button class="btn btn-secondary btn-sm" onclick="DataPage.openBulkEdit()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Toplu Düzenle
              </button>
              <button class="btn btn-danger btn-sm" onclick="DataPage.bulkDel()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                Toplu Sil
              </button>
            </div>
          </div>
        </div>
        <div class="filters">
          <input type="text" id="dataSearch" class="form-control search-input" placeholder="🔍  Lokasyon, numara veya ICCID ara...">
          <select id="dataOpFilter" class="form-control" style="width:160px">
            <option value="">Tüm Operatörler</option>
          </select>
          <select id="dataStatusFilter" class="form-control" style="width:140px">
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="spare">Yedek</option>
            <option value="passive">Pasif</option>
          </select>
          <button class="btn btn-secondary" onclick="DataPage.load()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/></svg>
            Yenile
          </button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width:40px"><input type="checkbox" id="dataSelectAll"></th>
                <th>#</th>
                <th>ICCID</th>
                <th>Telefon No</th>
                <th>Operatör</th>
                <th>Paket</th>
                <th>Durum</th>
                <th>Lokasyon</th>
                <th>Notlar</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody id="dataTableBody"></tbody>
          </table>
        </div>
      </div>

      <!-- Edit Modal -->
      <div class="modal-overlay" id="dataModal">
        <div class="modal" style="max-width:560px">
          <div class="modal-header">
            <span class="modal-title" id="dataModalTitle">Data Hattını Düzenle</span>
            <button class="modal-close" onclick="UI.closeModal('dataModal')">×</button>
          </div>
          <form class="modal-body" id="dataForm" onsubmit="DataPage.save(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">ICCID</label>
                <input name="iccid" class="form-control" placeholder="SIM kart ICCID numarası">
              </div>
              <div class="form-group">
                <label class="form-label">Telefon Numarası</label>
                <input name="phone_no" class="form-control" placeholder="05XX XXX XX XX">
              </div>
              <div class="form-group">
                <label class="form-label">Operatör <span style="color:var(--danger)">*</span></label>
                <select name="operator" class="form-control" id="dataOperatorSel" required onchange="SettingsPage?.onOperatorChange(this.value, 'data', 'dataPagePkgSel')"></select>
              </div>
              <div class="form-group">
                <label class="form-label">Paket Seç (İsteğe Bağlı)</label>
                <select name="package_id" class="form-control" id="dataPagePkgSel">
                  <option value="">Seçiniz...</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Durum</label>
                <select name="status" class="form-control">
                  <option value="active">Aktif</option>
                  <option value="spare">Yedek</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Lokasyon</label>
                <input name="location" class="form-control" list="locationsList" placeholder="Seçin veya yazın..." autocomplete="off">
                <datalist id="locationsList"></datalist>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Notlar</label>
                <textarea name="notes" class="form-control" placeholder="Ek açıklama..."></textarea>
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('dataModal')">İptal</button>
            <button class="btn btn-primary" onclick="document.getElementById('dataForm').requestSubmit()" id="dataSaveBtn">Kaydet</button>
          </div>
        </div>
      </div>

      <!-- Bulk Edit Modal -->
      <div class="modal-overlay" id="dataBulkModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">Toplu Data Düzenle</span>
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
        'iccid': { label: 'ICCID', getVal: r => r.iccid || '—' },
        'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
        'operator': { label: 'Operatör', getVal: r => r.operator || '—' },
        'package_name': { label: 'Paket', getVal: r => r.package_name || '—' },
        'status': { label: 'Durum', getVal: r => r.status || '—' },
        'location': { label: 'Lokasyon', getVal: r => r.location || '—' },
        'notes': { label: 'Notlar', getVal: r => r.notes || '—' }
      };

      if (!DataPage.colFilters) DataPage.colFilters = {};
      const unfilteredRows = rows;
      rows = UI.filterRows(rows, DataPage.colFilters, colDefs);
      rows = UI.sortRows(rows, DataPage.colFilters._sort, colDefs);

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="9">${UI.emptyState('🌐', 'Data hattı bulunamadı', 'Yeni hat eklemek için butona tıklayın.')}</td></tr>`;
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
          <td><strong>${r.location || '—'}</strong></td>
          <td class="td-muted" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.notes || '—'}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-secondary btn-sm btn-icon" title="Geçmiş" onclick="window.openTimeline(${r.id}, 'Data Hattı Geçmişi: ${r.location}')">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </button>
                ${window.AppPerms?.canEdit('data') ? `
              <button class="btn btn-secondary btn-sm btn-icon" title="Düzenle" onclick="DataPage.openEdit(${r.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="DataPage.del(${r.id}, '${r.location || r.phone_no || 'Bu kayıt'}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
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

  // openAdd function removed since addition is now centralized in settings


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

  async function save(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('dataSaveBtn');
    saveBtn.disabled = true;
    const data = UI.formData('dataForm');
    try {
      if (editingId) { await API.updateData(editingId, data); UI.toast('Data hattı güncellendi.', 'success'); }
      else { await API.addData(data); UI.toast('Data hattı eklendi.', 'success'); }
      UI.closeModal('dataModal');
      load();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { saveBtn.disabled = false; }
  }

  function del(id, label) {
    UI.confirm(`"${label}" kaydı silinecek. Bu işlem geri alınamaz.`, async () => {
      try { await API.deleteData(id); UI.toast('Kayıt silindi.', 'success'); load(); }
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

  return { render, load, openEdit, save, del, openBulkEdit, saveBulk, bulkDel, exportExcel };
})();
