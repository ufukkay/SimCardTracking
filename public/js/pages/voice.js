/* ─── SES HATLAR SAYFASI ─── */
const VoicePage = (() => {
  let editingId = null;
  let personnelCache = []; // for auto-fill

  function render() {
    document.getElementById('pageTitle').textContent = 'Ses Hatları';
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="VoicePage.openAdd()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Yeni Ekle
      </button>
    `;
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Ses Hat Listesi</span>
        </div>
        <div class="filters">
          <input type="text" id="voiceSearch" class="form-control search-input" placeholder="🔍  Personel, departman veya numara ara...">
          <select id="voiceOpFilter" class="form-control" style="width:160px">
            <option value="">Tüm Operatörler</option>
          </select>
          <select id="voiceStatusFilter" class="form-control" style="width:140px">
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="spare">Yedek</option>
            <option value="passive">Pasif</option>
          </select>
          <button class="btn btn-secondary" onclick="VoicePage.load()">
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
                <th>Personel</th>
                <th>Departman</th>
                <th>Şirket</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody id="voiceTableBody"></tbody>
          </table>
        </div>
      </div>

      <div class="modal-overlay" id="voiceModal">
        <div class="modal" style="max-width:560px">
          <div class="modal-header">
            <span class="modal-title" id="voiceModalTitle">Yeni Ses Hattı</span>
            <button class="modal-close" onclick="UI.closeModal('voiceModal')">×</button>
          </div>
          <form class="modal-body" id="voiceForm" onsubmit="VoicePage.save(event)">
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
                <select name="operator" class="form-control" id="voiceOperatorSel" required></select>
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
                <label class="form-label">Personel Adı Soyadı</label>
                <input name="assigned_to" id="voicePersonnelInput" class="form-control" list="personnelList" placeholder="Seçin veya yazın..." autocomplete="off">
                <datalist id="personnelList"></datalist>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Listeden seçince departman ve şirket otomatik dolar</div>
              </div>
              <div class="form-group">
                <label class="form-label">Departman</label>
                <input name="department" id="voiceDeptInput" class="form-control" placeholder="Muhasebe, IT...">
              </div>
              <div class="form-group">
                <label class="form-label">Şirket</label>
                <input name="assigned_company" id="voiceCompanyInput" class="form-control" placeholder="Şirket adı">
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Notlar</label>
                <textarea name="notes" class="form-control" placeholder="Ek açıklama..."></textarea>
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('voiceModal')">İptal</button>
            <button class="btn btn-primary" onclick="document.getElementById('voiceForm').requestSubmit()" id="voiceSaveBtn">Kaydet</button>
          </div>
        </div>
      </div>
    `;

    Promise.all([API.getOperators(), API.getPersonnel()]).then(([ops, personnel]) => {
      const filterEl = document.getElementById('voiceOpFilter');
      ops.forEach(o => { filterEl.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
      UI.fillOperatorSelect(document.getElementById('voiceOperatorSel'));
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
        'status': { label: 'Durum', getVal: r => r.status || '—' },
        'assigned_to': { label: 'Personel', getVal: r => r.assigned_to || '—' },
        'department': { label: 'Departman', getVal: r => r.department || '—' },
        'assigned_company': { label: 'Şirket', getVal: r => r.assigned_company || '—' }
      };

      if (!VoicePage.colFilters) VoicePage.colFilters = {};
      rows = UI.filterRows(rows, VoicePage.colFilters, colDefs);

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="9">${UI.emptyState('📞', 'Ses hattı bulunamadı', 'Yeni hat eklemek için butona tıklayın.')}</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map((r, i) => `
        <tr>
          <td class="td-muted">${i + 1}</td>
          <td class="td-muted" style="font-family:monospace;font-size:12px">${r.iccid || '—'}</td>
          <td>${r.phone_no || '—'}</td>
          <td>${UI.operatorBadge(r.operator)}</td>
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.assigned_to || '—'}</strong></td>
          <td class="td-muted">${r.department || '—'}</td>
          <td class="td-muted">${r.assigned_company || '—'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-secondary btn-sm btn-icon" title="Düzenle" onclick="VoicePage.openEdit(${r.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="VoicePage.del(${r.id}, '${r.assigned_to || r.phone_no || 'Bu kayıt'}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      UI.setupTableFilters('voiceTableBody', rows, VoicePage.colFilters, colDefs, () => load());

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:var(--danger);padding:20px">${err.message}</td></tr>`;
    }
  }

  function openAdd() {
    editingId = null;
    document.getElementById('voiceModalTitle').textContent = 'Yeni Ses Hattı';
    document.getElementById('voiceForm').reset();
    UI.openModal('voiceModal');
  }

  async function openEdit(id) {
    editingId = id;
    document.getElementById('voiceModalTitle').textContent = 'Ses Hattını Düzenle';
    try {
      const row = await API.get(`/voice/${id}`);
      UI.setForm('voiceForm', row);
      UI.openModal('voiceModal');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  async function save(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('voiceSaveBtn');
    saveBtn.disabled = true;
    const data = UI.formData('voiceForm');
    try {
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

  return { render, load, openAdd, openEdit, save, del };
})();
