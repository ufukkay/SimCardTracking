/* ─── TOPLU EKLEME / HIZLI EKLE MODALI ─── */
const BulkImport = (() => {
  let currentType = null;
  let onSuccess = null;
  let manualRows = [];
  let previewRows = [];

  const CONFIGS = {
    m2m: {
      label: 'M2M Hattı',
      fields: [
        { key: 'iccid',    label: 'ICCID',       placeholder: '8990011234...' },
        { key: 'phone_no', label: 'Telefon No',   placeholder: '053012345...' },
        { key: 'operator', label: 'Operatör',     type: 'operator' },
        { key: 'status',   label: 'Durum',        type: 'status' },
        { key: 'plate_no', label: 'Plaka',        placeholder: '34 ABC 001' },
        { key: 'notes',    label: 'Notlar',       placeholder: '' },
      ]
    },
    data: {
      label: 'Data Hattı',
      fields: [
        { key: 'iccid',    label: 'ICCID',       placeholder: '8990011234...' },
        { key: 'phone_no', label: 'Telefon No',   placeholder: '053012345...' },
        { key: 'operator', label: 'Operatör',     type: 'operator' },
        { key: 'status',   label: 'Durum',        type: 'status' },
        { key: 'location', label: 'Lokasyon',     placeholder: 'A Ofisi' },
        { key: 'notes',    label: 'Notlar',       placeholder: '' },
      ]
    },
    voice: {
      label: 'Ses Hattı',
      fields: [
        { key: 'iccid',            label: 'ICCID',       placeholder: '8990011234...' },
        { key: 'phone_no',         label: 'Telefon No',   placeholder: '053012345...' },
        { key: 'operator',         label: 'Operatör',     type: 'operator' },
        { key: 'status',           label: 'Durum',        type: 'status' },
        { key: 'assigned_to',      label: 'Personel',     placeholder: 'Ad Soyad' },
        { key: 'department',       label: 'Departman',    placeholder: 'IT, Muhasebe...' },
        { key: 'assigned_company', label: 'Şirket',       placeholder: 'ABC A.Ş.' },
        { key: 'notes',            label: 'Notlar',       placeholder: '' },
      ]
    }
  };

  const STATUS_OPTS = [
    { v: 'active',  l: 'Aktif' },
    { v: 'spare',   l: 'Yedek' },
    { v: 'passive', l: 'Pasif' },
  ];

  async function getOperatorOptions() {
    try {
      const ops = await API.getOperators();
      return ops.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
    } catch { return ''; }
  }

  function cellInput(field, rowIdx, opOptions) {
    if (field.type === 'operator') {
      return `<select class="form-control" data-row="${rowIdx}" data-key="${field.key}" style="min-width:100px">
        <option value="">Seç...</option>${opOptions}
      </select>`;
    }
    if (field.type === 'status') {
      return `<select class="form-control" data-row="${rowIdx}" data-key="${field.key}">
        ${STATUS_OPTS.map(o => `<option value="${o.v}">${o.l}</option>`).join('')}
      </select>`;
    }
    return `<input class="form-control" data-row="${rowIdx}" data-key="${field.key}" placeholder="${field.placeholder || ''}" value="${manualRows[rowIdx]?.[field.key] || ''}">`;
  }

  function renderManualTable(opOptions) {
    const cfg = CONFIGS[currentType];
    const thead = `<tr><th style="width:30px">#</th>${cfg.fields.map(f => `<th>${f.label}</th>`).join('')}<th></th></tr>`;
    const tbody = manualRows.map((row, i) =>
      `<tr>
        <td>${i + 1}</td>
        ${cfg.fields.map(f => `<td>${cellInput(f, i, opOptions)}</td>`).join('')}
        <td><button class="btn btn-ghost btn-sm btn-icon" onclick="BulkImport.removeRow(${i})" title="Sil">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button></td>
      </tr>`
    ).join('');
    return `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
  }

  function collectManualRows() {
    const inputs = document.querySelectorAll('#bulkManualTable [data-row]');
    const updated = [];
    inputs.forEach(el => {
      const row = parseInt(el.dataset.row);
      if (!updated[row]) updated[row] = {};
      updated[row][el.dataset.key] = el.value.trim() || null;
    });
    manualRows = updated;
  }

  async function open(type, successCallback) {
    currentType = type;
    onSuccess = successCallback;
    manualRows = Array.from({ length: 5 }, () => ({}));
    previewRows = [];

    const cfg = CONFIGS[type];
    const opOptions = await getOperatorOptions();

    // Inject modal if not present
    let overlay = document.getElementById('bulkModal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'bulkModal';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal" style="max-width:860px;width:100%">
        <div class="modal-header">
          <span class="modal-title">⚡ Toplu ${cfg.label} Ekle</span>
          <button class="modal-close" onclick="UI.closeModal('bulkModal')">×</button>
        </div>
        <div style="padding:0 20px">
          <div class="tabs">
            <button class="tab-btn active" onclick="BulkImport.switchBulkTab('manual', this)">✏️ Manuel Giriş</button>
            <button class="tab-btn" onclick="BulkImport.switchBulkTab('excel', this)">📊 Excel ile Yükle</button>
          </div>
        </div>

        <!-- Manuel Tab -->
        <div class="tab-pane active" id="bulkTab-manual">
          <div style="padding:0 20px 10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:13px;color:var(--text-muted)">Satır sayısı:</span>
            <input type="number" id="bulkRowCount" value="${manualRows.length}" min="1" max="500"
              class="form-control" style="width:80px"
              onchange="BulkImport.setRowCount(this.value)">
            <button class="btn btn-secondary btn-sm" onclick="BulkImport.addRows(10)">+ 10 Satır</button>
            <button class="btn btn-secondary btn-sm" onclick="BulkImport.addRows(50)">+ 50 Satır</button>
            <div style="margin-left:auto;display:flex;gap:8px">
              <span id="bulkManualCount" style="font-size:12px;color:var(--text-muted);align-self:center"></span>
            </div>
          </div>
          <div style="padding:0 20px;max-height:380px;overflow:auto">
            <div class="bulk-grid">
              <table id="bulkManualTable">${renderManualTable(opOptions)}</table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('bulkModal')">İptal</button>
            <button class="btn btn-primary" id="bulkManualSaveBtn" onclick="BulkImport.saveManual()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
              Tümünü Kaydet
            </button>
          </div>
        </div>

        <!-- Excel Tab -->
        <div class="tab-pane" id="bulkTab-excel">
          <div style="padding:16px 20px;display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;gap:10px;align-items:center;padding:14px;background:var(--info-light);border-radius:var(--radius-sm);border:1px solid #bfdbfe">
              <span style="font-size:20px">📋</span>
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px;margin-bottom:3px">1. Adım: Şablonu İndir</div>
                <div style="font-size:12px;color:var(--text-secondary)">Boş Excel şablonunu indir, doldur ve yükle.</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="API.downloadTemplate('${type}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Şablon İndir
              </button>
            </div>

            <div>
              <div style="font-weight:600;font-size:13px;margin-bottom:8px">2. Adım: Dosyayı Yükle</div>
              <div class="import-area" id="importDropZone" onclick="document.getElementById('excelFileInput').click()">
                <input type="file" id="excelFileInput" accept=".xlsx,.xls" onchange="BulkImport.onFileSelect(this)">
                <div class="import-area-icon">📂</div>
                <div class="import-area-text">Excel dosyasını seçin veya sürükleyin</div>
                <div class="import-area-sub">.xlsx veya .xls, maks. 5 MB</div>
              </div>
            </div>

            <div id="importPreviewWrap" style="display:none">
              <div style="font-weight:600;font-size:13px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
                <span>Önizleme <span id="previewCount" style="color:var(--text-muted);font-weight:400"></span></span>
                <button class="btn btn-ghost btn-sm" onclick="BulkImport.clearFile()" style="font-size:12px">× Temizle</button>
              </div>
              <div class="import-preview" id="importPreview"></div>
            </div>

            <div id="importResultWrap" style="display:none"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="UI.closeModal('bulkModal')">İptal</button>
            <button class="btn btn-primary" id="excelImportBtn" onclick="BulkImport.saveExcel()" disabled>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Yükle ve Aktar
            </button>
          </div>
        </div>
      </div>
    `;

    // Drag and drop
    const dz = overlay.querySelector('#importDropZone');
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) { document.getElementById('excelFileInput').files = e.dataTransfer.files; onFileSelect(document.getElementById('excelFileInput')); }
    });

    UI.openModal('bulkModal');
  }

  async function onFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    const XLSX = window.XLSX;
    if (!XLSX) return UI.toast('XLSX kütüphanesi yüklenmedi.', 'error');

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    previewRows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!previewRows.length) { UI.toast('Dosyada veri bulunamadı.', 'error'); return; }

    document.getElementById('previewCount').textContent = `(${previewRows.length} satır)`;
    document.getElementById('importPreviewWrap').style.display = 'block';
    document.getElementById('importResultWrap').style.display = 'none';

    const headers = Object.keys(previewRows[0]);
    const preview = document.getElementById('importPreview');
    preview.innerHTML = `<table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${previewRows.slice(0, 10).map(r => `<tr>${headers.map(h => `<td>${r[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
    if (previewRows.length > 10) {
      preview.innerHTML += `<div style="text-align:center;padding:8px;font-size:12px;color:var(--text-muted)">... ve ${previewRows.length - 10} satır daha</div>`;
    }

    document.getElementById('excelImportBtn').disabled = false;
  }

  function clearFile() {
    previewRows = [];
    document.getElementById('excelFileInput').value = '';
    document.getElementById('importPreviewWrap').style.display = 'none';
    document.getElementById('excelImportBtn').disabled = true;
  }

  function switchBulkTab(tabId, btn) {
    // Scope all changes to the nearest common parent of the tabs
    const tabsEl = btn.closest('.tabs');
    const parent = tabsEl ? tabsEl.parentElement : document;
    tabsEl?.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    parent?.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    // Support full IDs (st-add-data) and legacy short IDs (manual → bulkTab-manual)
    const pane = document.getElementById(tabId) || document.getElementById(`bulkTab-${tabId}`);
    pane?.classList.add('active');
  }

  function setRowCount(n) {
    collectManualRows();
    const count = Math.max(1, Math.min(500, parseInt(n) || 5));
    while (manualRows.length < count) manualRows.push({});
    manualRows = manualRows.slice(0, count);
    refreshManualTable();
  }

  function addRows(n) {
    collectManualRows();
    for (let i = 0; i < n; i++) manualRows.push({});
    document.getElementById('bulkRowCount').value = manualRows.length;
    refreshManualTable();
  }

  function removeRow(i) {
    collectManualRows();
    manualRows.splice(i, 1);
    if (!manualRows.length) manualRows.push({});
    document.getElementById('bulkRowCount').value = manualRows.length;
    refreshManualTable();
  }

  async function refreshManualTable() {
    const opOptions = await getOperatorOptions();
    document.getElementById('bulkManualTable').innerHTML = renderManualTable(opOptions);
  }

  async function saveManual() {
    collectManualRows();
    const nonEmpty = manualRows.filter(r => Object.values(r).some(v => v));
    if (!nonEmpty.length) return UI.toast('En az bir satır doldurun.', 'error');

    const btn = document.getElementById('bulkManualSaveBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:13px;height:13px;border-width:2px"></div> Kaydediliyor...';
    try {
      const result = await API.importJSON(currentType, nonEmpty);
      UI.toast(`${result.inserted} kayıt eklendi.`, 'success');
      if (result.errors?.length) {
        result.errors.forEach(e => UI.toast(e, 'error'));
      }
      UI.closeModal('bulkModal');
      onSuccess?.();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Tümünü Kaydet';
    }
  }

  async function saveExcel() {
    const input = document.getElementById('excelFileInput');
    if (!input.files[0]) return UI.toast('Dosya seçilmedi.', 'error');

    const btn = document.getElementById('excelImportBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:13px;height:13px;border-width:2px"></div> Yükleniyor...';
    try {
      const result = await API.importExcel(currentType, input.files[0]);
      const resultWrap = document.getElementById('importResultWrap');
      resultWrap.style.display = 'block';
      resultWrap.innerHTML = `
        <div style="padding:12px 14px;background:var(--success-light);border:1px solid #86efac;border-radius:var(--radius-sm)">
          <div style="font-weight:600;color:var(--success);margin-bottom:4px">✓ ${result.inserted} kayıt eklendi.</div>
          ${result.errors?.length ? `<div style="font-size:12px;color:var(--danger);margin-top:6px">${result.errors.slice(0,5).join('<br>')}</div>` : ''}
        </div>`;
      UI.toast(`${result.inserted} kayıt eklendi.`, 'success');
      onSuccess?.();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Yükle ve Aktar';
    }
  }

  /* ─── INLINE TAB RENDER (for Settings page) ─── */
  async function renderTab(type, containerId, successCallback) {
    currentType = type;
    onSuccess = successCallback;
    manualRows = Array.from({ length: 5 }, () => ({}));
    previewRows = [];

    const container = document.getElementById(containerId);
    if (!container) return;

    // Load operators and type-specific master list in parallel
    const opOptions = await getOperatorOptions();
    let masterList = [];
    if (type === 'm2m') { try { masterList = await API.getVehicles(); } catch(e){} }
    if (type === 'data') { try { masterList = await API.getLocations(); } catch(e){} }
    if (type === 'voice') { try { masterList = await API.getPersonnel(); } catch(e){} }

    const masterDatalistId = `mdl-${type}`;
    let masterDatalistHtml = '';
    if (type === 'm2m') masterDatalistHtml = masterList.map(v => `<option value="${v.plate_no}">${v.plate_no}${v.vehicle_type ? ' – ' + v.vehicle_type : ''}</option>`).join('');
    if (type === 'data') masterDatalistHtml = masterList.map(l => `<option value="${l.name}">${l.name}${l.address ? ' – ' + l.address : ''}</option>`).join('');
    if (type === 'voice') masterDatalistHtml = masterList.map(p => `<option value="${p.first_name} ${p.last_name}">${p.first_name} ${p.last_name}${p.department ? ' – ' + p.department : ''}${p.company ? ' (' + p.company + ')' : ''}</option>`).join('');

    // Type-specific extra field(s) for the single-add form
    let extraFieldHtml = '';
    if (type === 'm2m') extraFieldHtml = `
      <div class="form-group col-span-2">
        <label class="form-label">Plaka</label>
        <input name="plate_no" class="form-control" list="${masterDatalistId}" placeholder="Seçin veya yazın..." autocomplete="off">
        <datalist id="${masterDatalistId}">${masterDatalistHtml}</datalist>
      </div>`;
    if (type === 'data') extraFieldHtml = `
      <div class="form-group col-span-2">
        <label class="form-label">Lokasyon</label>
        <input name="location" class="form-control" list="${masterDatalistId}" placeholder="Seçin veya yazın..." autocomplete="off">
        <datalist id="${masterDatalistId}">${masterDatalistHtml}</datalist>
      </div>`;
    if (type === 'voice') extraFieldHtml = `
      <div class="form-group col-span-2">
        <label class="form-label">Personel Adı Soyadı</label>
        <input name="assigned_to" id="s-voice-person-${type}" class="form-control" list="${masterDatalistId}" placeholder="Seçin veya yazın..." autocomplete="off">
        <datalist id="${masterDatalistId}">${masterDatalistHtml}</datalist>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Seçince departman ve şirket otomatik dolar</div>
      </div>
      <div class="form-group">
        <label class="form-label">Departman</label>
        <input name="department" id="s-voice-dept-${type}" class="form-control" placeholder="IT, Muhasebe...">
      </div>
      <div class="form-group">
        <label class="form-label">Şirket</label>
        <input name="assigned_company" id="s-voice-comp-${type}" class="form-control" placeholder="Şirket adı">
      </div>`;

    container.innerHTML = `
      <div>
        <div class="tabs" style="margin-bottom:18px">
          <button class="tab-btn active" onclick="BulkImport.switchBulkTab('st-add-${type}', this)">➕ Yeni Ekle</button>
          <button class="tab-btn" onclick="BulkImport.switchBulkTab('st-manual-${type}', this)">✏️ Manuel Giriş</button>
          <button class="tab-btn" onclick="BulkImport.switchBulkTab('st-excel-${type}', this)">📊 Excel ile Yükle</button>
        </div>

        <!-- YENİ EKLE -->
        <div class="tab-pane active" id="st-add-${type}">
          <form id="s-add-form-${type}" onsubmit="BulkImport.saveSingle(event,'${type}')" style="max-width:640px">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">ICCID</label>
                <input name="iccid" class="form-control" placeholder="SIM kart ICCID">
              </div>
              <div class="form-group">
                <label class="form-label">Telefon Numarası</label>
                <input name="phone_no" class="form-control" placeholder="05XX XXX XX XX">
              </div>
              <div class="form-group">
                <label class="form-label">Operatör <span style="color:var(--danger)">*</span></label>
                <select name="operator" class="form-control" id="s-op-${type}" required>${opOptions}</select>
              </div>
              <div class="form-group">
                <label class="form-label">Durum</label>
                <select name="status" class="form-control">
                  <option value="active">Aktif</option>
                  <option value="spare">Yedek</option>
                  <option value="passive">Pasif</option>
                </select>
              </div>
              ${extraFieldHtml}
              <div class="form-group col-span-2">
                <label class="form-label">Notlar</label>
                <textarea name="notes" class="form-control" placeholder="Ek açıklama..."></textarea>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:4px">
              <button type="submit" class="btn btn-primary" id="s-add-btn-${type}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Hat Ekle
              </button>
            </div>
          </form>
        </div>

        <!-- MANUEL GİRİŞ -->
        <div class="tab-pane" id="st-manual-${type}">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
            <span style="font-size:13px;color:var(--text-muted)">Satır sayısı:</span>
            <input type="number" id="inline-rowcount-${type}" value="5" min="1" max="500" class="form-control" style="width:80px" onchange="BulkImport.setRowCountInline('${type}', this.value)">
            <button class="btn btn-secondary btn-sm" onclick="BulkImport.addRowsInline('${type}', 10)">+ 10 Satır</button>
            <button class="btn btn-secondary btn-sm" onclick="BulkImport.addRowsInline('${type}', 50)">+ 50 Satır</button>
          </div>
          <div style="max-height:400px;overflow:auto;margin-bottom:12px">
            <div class="bulk-grid">
              <table id="inline-manual-table-${type}">${renderManualTable(opOptions)}</table>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary" id="inline-save-${type}" onclick="BulkImport.saveManualInline('${type}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
              Tümünü Kaydet
            </button>
          </div>
        </div>

        <!-- EXCEL -->
        <div class="tab-pane" id="st-excel-${type}">
          <div style="display:flex;flex-direction:column;gap:14px">
            <div style="display:flex;gap:10px;align-items:center;padding:14px;background:var(--info-light);border-radius:var(--radius-sm);border:1px solid #bfdbfe">
              <span style="font-size:20px">📋</span>
              <div style="flex:1">
                <div style="font-weight:600;font-size:13px;margin-bottom:3px">1. Adım: Şablonu İndir</div>
                <div style="font-size:12px;color:var(--text-secondary)">Boş Excel şablonunu indir, doldur ve yükle.</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="API.downloadTemplate('${type}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Şablon İndir
              </button>
            </div>
            <div>
              <div style="font-weight:600;font-size:13px;margin-bottom:8px">2. Adım: Dosyayı Yükle</div>
              <div class="import-area" id="inline-drop-${type}" onclick="document.getElementById('inline-file-${type}').click()">
                <input type="file" id="inline-file-${type}" accept=".xlsx,.xls" onchange="BulkImport.onFileSelectInline(this, '${type}')">
                <div class="import-area-icon">📂</div>
                <div class="import-area-text">Excel dosyasını seçin veya sürükleyin</div>
                <div class="import-area-sub">.xlsx veya .xls, maks. 5 MB</div>
              </div>
            </div>
            <div id="inline-preview-wrap-${type}" style="display:none">
              <div style="font-weight:600;font-size:13px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
                <span>Önizleme <span id="inline-preview-count-${type}" style="color:var(--text-muted);font-weight:400"></span></span>
                <button class="btn btn-ghost btn-sm" onclick="BulkImport.clearFileInline('${type}')" style="font-size:12px">× Temizle</button>
              </div>
              <div class="import-preview" id="inline-preview-${type}"></div>
            </div>
            <div id="inline-result-${type}" style="display:none"></div>
            <div style="display:flex;justify-content:flex-end">
              <button class="btn btn-primary" id="inline-excel-btn-${type}" onclick="BulkImport.saveExcelInline('${type}')" disabled>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Yükle ve Aktar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Drag-and-drop for Excel upload
    const dz = document.getElementById(`inline-drop-${type}`);
    if (dz) {
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', e => {
        e.preventDefault(); dz.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) { document.getElementById(`inline-file-${type}`).files = e.dataTransfer.files; onFileSelectInline(document.getElementById(`inline-file-${type}`), type); }
      });
    }

    // Personnel auto-fill for voice
    if (type === 'voice' && masterList.length) {
      const personInput = document.getElementById(`s-voice-person-${type}`);
      if (personInput) {
        personInput.addEventListener('input', () => {
          const val = personInput.value.trim();
          const match = masterList.find(p => `${p.first_name} ${p.last_name}`.toLowerCase() === val.toLowerCase());
          if (match) {
            const dept = document.getElementById(`s-voice-dept-${type}`);
            const comp = document.getElementById(`s-voice-comp-${type}`);
            if (dept && !dept.value) dept.value = match.department || '';
            if (comp && !comp.value) comp.value = match.company || '';
          }
        });
      }
    }
  }

  /* Save a single SIM record from the inline add form */
  async function saveSingle(e, type) {
    e.preventDefault();
    const btn = document.getElementById(`s-add-btn-${type}`);
    btn.disabled = true;
    const form = document.getElementById(`s-add-form-${type}`);
    const data = UI.formData(`s-add-form-${type}`);
    try {
      if (type === 'm2m') await API.addM2M(data);
      else if (type === 'data') await API.addData(data);
      else if (type === 'voice') await API.addVoice(data);
      UI.toast('Hat eklendi.', 'success');
      form.reset();
      onSuccess?.();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { btn.disabled = false; }
  }
  function collectInlineRows(type) {
    const inputs = document.querySelectorAll(`#inline-manual-table-${type} [data-row]`);
    const updated = [];
    inputs.forEach(el => {
      const row = parseInt(el.dataset.row);
      if (!updated[row]) updated[row] = {};
      updated[row][el.dataset.key] = el.value.trim() || null;
    });
    manualRows = updated;
  }

  async function refreshInlineTable(type) {
    const opOptions = await getOperatorOptions();
    const table = document.getElementById(`inline-manual-table-${type}`);
    if (table) table.innerHTML = renderManualTable(opOptions);
    const rc = document.getElementById(`inline-rowcount-${type}`);
    if (rc) rc.value = manualRows.length;
  }

  function setRowCountInline(type, n) {
    collectInlineRows(type);
    const count = Math.max(1, Math.min(500, parseInt(n) || 5));
    while (manualRows.length < count) manualRows.push({});
    manualRows = manualRows.slice(0, count);
    refreshInlineTable(type);
  }

  function addRowsInline(type, n) {
    collectInlineRows(type);
    for (let i = 0; i < n; i++) manualRows.push({});
    refreshInlineTable(type);
  }

  async function saveManualInline(type) {
    collectInlineRows(type);
    const nonEmpty = manualRows.filter(r => Object.values(r).some(v => v));
    if (!nonEmpty.length) return UI.toast('En az bir satır doldurun.', 'error');
    const btn = document.getElementById(`inline-save-${type}`);
    btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:13px;height:13px;border-width:2px"></div> Kaydediliyor...';
    try {
      const result = await API.importJSON(type, nonEmpty);
      UI.toast(`${result.inserted} kayıt eklendi.`, 'success');
      if (result.errors?.length) result.errors.forEach(e => UI.toast(e, 'error'));
      // Reset rows
      manualRows = Array.from({ length: 5 }, () => ({}));
      refreshInlineTable(type);
      onSuccess?.();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Tümünü Kaydet'; }
  }

  async function onFileSelectInline(input, type) {
    const file = input.files[0]; if (!file) return;
    const XLSX = window.XLSX;
    if (!XLSX) return UI.toast('XLSX kütüphanesi yüklenmedi.', 'error');
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    previewRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!previewRows.length) { UI.toast('Dosyada veri bulunamadı.', 'error'); return; }
    document.getElementById(`inline-preview-count-${type}`).textContent = `(${previewRows.length} satır)`;
    document.getElementById(`inline-preview-wrap-${type}`).style.display = 'block';
    document.getElementById(`inline-result-${type}`).style.display = 'none';
    const headers = Object.keys(previewRows[0]);
    const preview = document.getElementById(`inline-preview-${type}`);
    preview.innerHTML = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${previewRows.slice(0, 10).map(r => `<tr>${headers.map(h => `<td>${r[h]||''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    if (previewRows.length > 10) preview.innerHTML += `<div style="text-align:center;padding:8px;font-size:12px;color:var(--text-muted)">... ve ${previewRows.length - 10} satır daha</div>`;
    document.getElementById(`inline-excel-btn-${type}`).disabled = false;
  }

  function clearFileInline(type) {
    previewRows = [];
    const fi = document.getElementById(`inline-file-${type}`); if (fi) fi.value = '';
    document.getElementById(`inline-preview-wrap-${type}`).style.display = 'none';
    document.getElementById(`inline-excel-btn-${type}`).disabled = true;
  }

  async function saveExcelInline(type) {
    const input = document.getElementById(`inline-file-${type}`);
    if (!input?.files[0]) return UI.toast('Dosya seçilmedi.', 'error');
    const btn = document.getElementById(`inline-excel-btn-${type}`);
    btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:13px;height:13px;border-width:2px"></div> Yükleniyor...';
    try {
      const result = await API.importExcel(type, input.files[0]);
      const resultEl = document.getElementById(`inline-result-${type}`);
      resultEl.style.display = 'block';
      resultEl.innerHTML = `<div style="padding:12px 14px;background:var(--success-light);border:1px solid #86efac;border-radius:var(--radius-sm)"><div style="font-weight:600;color:var(--success);margin-bottom:4px">✓ ${result.inserted} kayıt eklendi.</div>${result.errors?.length ? `<div style="font-size:12px;color:var(--danger);margin-top:6px">${result.errors.slice(0,5).join('<br>')}</div>` : ''}</div>`;
      UI.toast(`${result.inserted} kayıt eklendi.`, 'success');
      clearFileInline(type);
      onSuccess?.();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Yükle ve Aktar'; }
  }

  return {
    open, onFileSelect, clearFile, switchBulkTab, setRowCount, addRows, removeRow, saveManual, saveExcel,
    renderTab, saveSingle, setRowCountInline, addRowsInline, saveManualInline, onFileSelectInline, clearFileInline, saveExcelInline,
  };
})();
