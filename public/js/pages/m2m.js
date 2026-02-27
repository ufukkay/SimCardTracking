/* ─── M2M HATLAR SAYFASI ─── */
const M2MPage = (() => {
  let editingId = null;

  function render() {
    document.getElementById('pageTitle').textContent = 'M2M Hatları';
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="M2MPage.openAdd()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Yeni Ekle
      </button>
    `;
    document.getElementById('pageContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">M2M Hat Listesi</span>
        </div>
        <div class="filters">
          <input type="text" id="m2mSearch" class="form-control search-input" placeholder="🔍  Plaka, numara veya ICCID ara...">
          <select id="m2mOpFilter" class="form-control" style="width:160px">
            <option value="">Tüm Operatörler</option>
          </select>
          <select id="m2mTypeFilter" class="form-control" style="width:160px">
            <option value="">Tüm Araç Tipleri</option>
            <option value="Binek">Binek</option>
            <option value="Çekici">Çekici</option>
            <option value="Yol Kamerası">Yol Kamerası</option>
            <option value="IoT Cihazı">IoT Cihazı</option>
          </select>
          <select id="m2mStatusFilter" class="form-control" style="width:140px">
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="spare">Yedek</option>
            <option value="passive">Pasif</option>
          </select>
          <button class="btn btn-secondary" onclick="M2MPage.load()">
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
                <th>Araç Tipi</th>
                <th>Durum</th>
                <th>Plaka</th>
                <th>Notlar</th>
                <th>İşlem</th>
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
            <span class="modal-title" id="m2mModalTitle">Yeni M2M Hattı</span>
            <button class="modal-close" onclick="UI.closeModal('m2mModal')">×</button>
          </div>
          <form class="modal-body" id="m2mForm" onsubmit="M2MPage.save(event)">
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
                <select name="operator" class="form-control" id="m2mOperatorSel" required></select>
              </div>
              <div class="form-group">
                <label class="form-label">Durum</label>
                <select name="status" class="form-control">
                  <option value="active">Aktif</option>
                  <option value="spare">Yedek</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Araç Tipi</label>
                <select name="vehicle_type" class="form-control">
                  <option value="">Seçiniz...</option>
                  <option value="Binek">Binek</option>
                  <option value="Çekici">Çekici</option>
                  <option value="Yol Kamerası">Yol Kamerası</option>
                  <option value="IoT Cihazı">IoT Cihazı</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Plaka</label>
                <input name="plate_no" class="form-control" list="vehiclesList" id="m2mPlateInput" placeholder="Seçin veya yazın..." autocomplete="off">
                <datalist id="vehiclesList"></datalist>
              </div>
              <div class="form-group col-span-2">
                <label class="form-label">Notlar</label>
                <textarea name="notes" class="form-control" placeholder="Ek açıklama..."></textarea>
              </div>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('m2mModal')">İptal</button>
            <button class="btn btn-primary" onclick="document.getElementById('m2mForm').requestSubmit()" id="m2mSaveBtn">Kaydet</button>
          </div>
        </div>
      </div>
    `;

    // Fill filters, operator select, and vehicle datalist
    Promise.all([API.getOperators(), API.getVehicles()]).then(([ops, vehicles]) => {
      const filterEl = document.getElementById('m2mOpFilter');
      ops.forEach(o => { filterEl.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
      UI.fillOperatorSelect(document.getElementById('m2mOperatorSel'));
      const dl = document.getElementById('vehiclesList');
      if (dl) dl.innerHTML = vehicles.map(v => `<option value="${v.plate_no}">${v.plate_no}${v.vehicle_type ? ' – ' + v.vehicle_type : ''}</option>`).join('');
    });

    // Search and filter events
    let debounceTimer;
    ['m2mSearch', 'm2mOpFilter', 'm2mTypeFilter', 'm2mStatusFilter'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => M2MPage.load(), 350);
      });
    });

    // Auto-fill Araç Tipi when a plate is selected
    const plateInput = document.getElementById('m2mPlateInput');
    const typeSelect = document.querySelector('#m2mForm select[name="vehicle_type"]');
    if (plateInput && typeSelect) {
      plateInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const dl = document.getElementById('vehiclesList');
        if (!dl) return;
        const option = Array.from(dl.options).find(opt => opt.value === val);
        if (option) {
          // The option text contains the vehicle type after " – "
          const textMatches = option.textContent.match(/ – (.+)$/);
          if (textMatches && textMatches[1]) {
             typeSelect.value = textMatches[1];
          }
        }
      });
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
        'vehicle_type': { label: 'Araç Tipi', getVal: r => r.vehicle_type || '—' },
        'status': { label: 'Durum', getVal: r => r.status || '—' },
        'plate_no': { label: 'Plaka', getVal: r => r.plate_no || '—' },
        'notes': { label: 'Notlar', getVal: r => r.notes || '—' }
      };

      if (!M2MPage.colFilters) M2MPage.colFilters = {};
      rows = UI.filterRows(rows, M2MPage.colFilters, colDefs);

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="9">${UI.emptyState('🚗', 'M2M hattı bulunamadı', 'Yeni hat eklemek için butona tıklayın.')}</td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map((r, i) => `
        <tr>
          <td class="td-muted">${i + 1}</td>
          <td class="td-muted" style="font-family:monospace;font-size:12px">${r.iccid || '—'}</td>
          <td>${r.phone_no || '—'}</td>
          <td>${UI.operatorBadge(r.operator)}</td>
          <td>${r.vehicle_type ? `<span class="badge" style="background:var(--bg-secondary);color:var(--text-main)">${r.vehicle_type}</span>` : '—'}</td>
          <td>${UI.statusBadge(r.status)}</td>
          <td><strong>${r.plate_no || '—'}</strong></td>
          <td class="td-muted" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.notes || '—'}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-secondary btn-sm btn-icon" title="Düzenle" onclick="M2MPage.openEdit(${r.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm btn-icon" title="Sil" onclick="M2MPage.del(${r.id}, '${r.plate_no || r.phone_no || 'Bu kayıt'}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      UI.setupTableFilters('m2mTableBody', rows, M2MPage.colFilters, colDefs, () => load());

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:20px">${err.message}</td></tr>`;
    }
  }

  function openAdd() {
    editingId = null;
    document.getElementById('m2mModalTitle').textContent = 'Yeni M2M Hattı';
    document.getElementById('m2mForm').reset();
    UI.openModal('m2mModal');
  }

  async function openEdit(id) {
    editingId = id;
    document.getElementById('m2mModalTitle').textContent = 'M2M Hattını Düzenle';
    try {
      const row = await API.get(`/m2m/${id}`);
      UI.setForm('m2mForm', row);
      UI.openModal('m2mModal');
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  async function save(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('m2mSaveBtn');
    saveBtn.disabled = true;
    const data = UI.formData('m2mForm');
    try {
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

  return { render, load, openAdd, openEdit, save, del };
})();
