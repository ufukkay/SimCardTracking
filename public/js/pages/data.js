/* ─── DATA HATLAR SAYFASI ─── */
const DataPage = (() => {
  let editingId = null;

  function render() {
    document.getElementById('pageTitle').textContent = 'Data Hatları';
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Data Hat Listesi</span>
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
                <th>#</th>
                <th>ICCID</th>
                <th>Telefon No</th>
                <th>Operatör</th>
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
                <select name="operator" class="form-control" id="dataOperatorSel" required></select>
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
    `;

    Promise.all([API.getOperators(), API.getLocations()]).then(([ops, locs]) => {
      const filterEl = document.getElementById('dataOpFilter');
      ops.forEach(o => { filterEl.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
      UI.fillOperatorSelect(document.getElementById('dataOperatorSel'));
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
      const rows = await API.getData(qs);
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="8">${UI.emptyState('🌐', 'Data hattı bulunamadı', 'Yeni hat eklemek için butona tıklayın.')}</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map((r, i) => `
        <tr>
          <td class="td-muted">${i + 1}</td>
          <td class="td-muted" style="font-family:monospace;font-size:12px">${r.iccid || '—'}</td>
          <td>${r.phone_no || '—'}</td>
          <td>${UI.operatorBadge(r.operator)}</td>
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.location || '—'}</strong></td>
          <td class="td-muted" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.notes || '—'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-secondary btn-sm btn-icon" title="Düzenle" onclick="DataPage.openEdit(${r.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="DataPage.del(${r.id}, '${r.location || r.phone_no || 'Bu kayıt'}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:20px">${err.message}</td></tr>`;
    }
  }

  function openAdd() {
    editingId = null;
    document.getElementById('dataModalTitle').textContent = 'Yeni Data Hattı';
    document.getElementById('dataForm').reset();
    UI.openModal('dataModal');
  }

  async function openEdit(id) {
    editingId = id;
    document.getElementById('dataModalTitle').textContent = 'Data Hattını Düzenle';
    try {
      const row = await API.get(`/data/${id}`);
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

  return { render, load, openAdd, openEdit, save, del };
})();
