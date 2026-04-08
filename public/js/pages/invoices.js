/* ─── FATURA YÖNETİMİ ─── */
const InvoicesPage = (() => {
  let canEditInvoices = true;
  let currentSummaryData = [];
  
  // State for detailing
  let activePeriod = null;
  let activeOperator = null;
  let activeSourceFile = null;
  
  let selectedInvoiceIds = new Set();
  let selectedSummaryKeys = new Set();

  function render() {
    canEditInvoices = window.AppPerms?.canEdit ? window.AppPerms.canEdit('invoices') : true;
    document.getElementById('pageTitle').textContent = i18n.t('nav_invoices') || 'Faturalar';
    document.getElementById('topbarActions').innerHTML = canEditInvoices ? `
      <button class="btn btn-primary" onclick="InvoicesPage.openUploadModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>Fatura Dosyası Yükle</span>
      </button>
    ` : '';

    document.getElementById('pageContent').innerHTML = `
      <div id="invoicesDashboard">
        
        <!-- Yüklenmiş Dosyalar (Dönemlere Göre) -->
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header" style="display:flex; justify-content:space-between;">
            <h3 class="card-title">Sistemdeki Fatura Belgeleri</h3>
            <div id="summaryBulkActionsBar" class="bulk-actions-bar" style="display:none; margin-left:auto">
              <span id="summarySelectedCount" style="margin-right:15px; font-weight:600;">0 belge seçildi</span>
              <button class="btn btn-danger btn-sm" onclick="InvoicesPage.bulkDeleteSummaries()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                <span>Seçili Belgeleri Sil</span>
              </button>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width:32px"><input type="checkbox" id="summarySelectAll" onclick="InvoicesPage.toggleAllSummaries(this)"></th>
                  <th style="width:120px;">Dönem</th>
                  <th>Operatör</th>
                  <th>Bağımsız Dosya Adı / Referans</th>
                  <th>Kayıt Sayısı</th>
                  <th>Toplam KDV</th>
                  <th>Toplam ÖİV</th>
                  <th>Fatura Genel Toplamı</th>
                  <th style="width:120px;text-align:right">İşlem</th>
                </tr>
              </thead>
              <tbody id="invoicesSummaryList">
                <tr><td colspan="9" style="text-align:center">${i18n.t('loading') || 'Yükleniyor...'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Seçili Dosya İçeriği (Detaylar) -->
        <div class="card" style="display:none" id="invoiceDetailCard">
          <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
             <h3 class="card-title" id="detailTitle">Fatura İçeriği</h3>
             
             <div style="display:flex; align-items:center; gap:10px;">
                <select id="isMatchedFilter" class="form-control" style="width:160px; padding:4px 8px;" onchange="InvoicesPage.filterDetail(this.value)">
                  <option value="">Tüm Satırlar</option>
                  <option value="1">Eşleşen (Kayıtlı) Hatlar</option>
                  <option value="0">Eşleşmeyen (Sahipsiz) Hatlar</option>
                </select>
             </div>

             <div id="invoiceBulkActionsBar" class="bulk-actions-bar" style="display:none; margin-left:auto">
                <span id="invoiceSelectedCount" style="margin-right:15px; font-weight:600;">0 satır seçildi</span>
                <div class="bulk-buttons">
                  <button class="btn btn-secondary btn-sm" onclick="InvoicesPage.openBulkEdit()">Masraf/Kişi Düzenle</button>
                  <button class="btn btn-danger btn-sm" onclick="InvoicesPage.bulkDelete()">Sıradan Sil</button>
                </div>
             </div>
             <div style="display:flex; align-items:center; gap:10px;">
                <button class="btn btn-secondary btn-sm" onclick="InvoicesPage.downloadActiveDetail()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span>Excel Olarak İndir</span>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="document.getElementById('invoiceDetailCard').style.display='none'">Gizle</button>
             </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                 <tr>
                    <th style="width:32px"><input type="checkbox" id="invoiceSelectAll" onclick="InvoicesPage.toggleAll(this)"></th>
                    <th>Telefon No</th>
                    <th>Zimmetli / Personel / Konum</th>
                    <th>Şirket</th>
                    <th>Masraf Kalemi</th>
                    <th>Tarife</th>
                    <th>Vergiler (KDV/ÖİV)</th>
                    <th>Ödenecek Tutar</th>
                 </tr>
              </thead>
              <tbody id="invoicesDetailList">
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- History Modal -->
      <div class="modal-overlay" id="invoiceHistoryModal" style="display:none;">
        <div class="modal" style="max-width: 700px; width: 95%;">
          <div class="modal-header">
            <span class="modal-title" id="historyModalTitle">Hat Fatura Geçmişi</span>
            <button class="modal-close" onclick="UI.closeModal('invoiceHistoryModal')">×</button>
          </div>
          <div class="modal-body" id="historyModalBody" style="max-height:60vh; overflow-y:auto; padding:0;">
          </div>
        </div>
      </div>
    `;

    loadSummary();
    renderUploadModal();
  }

  const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  async function loadSummary() {
    try {
      const res = await API.get('/invoices/summary');
      currentSummaryData = res;
      const tbody = document.getElementById('invoicesSummaryList');
      if (!res || res.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9">${UI.emptyState('📄', 'Sistemde Fatura Kaydı Yok', 'Yukarıdaki butonu kullanarak PDF veya XML fatura belgelerinizi yükleyin.')}</td></tr>`;
        return;
      }
      
      tbody.innerHTML = res.map(row => {
        const key = `${row.period}|${row.operator}|${row.source_file}`;
        
        // Eşleşmeyen satırlar için uyarı badge'i
        const unmatchedBadge = row.unmatched_count > 0 
          ? `<span class="badge badge-danger" style="margin-top:4px;" title="${row.unmatched_count} satır sistemde hiçbir hatta eşleşmedi">⚠️ ${row.unmatched_count} Eşleşmeyen</span>` 
          : `<span class="badge badge-success" style="margin-top:4px;">Tümü Eşleşti ✅</span>`;

        return `
        <tr>
          <td><input type="checkbox" class="summary-select" value="${key}" onchange="InvoicesPage.toggleSummarySelection('${key}', this.checked)"></td>
          <td><strong style="font-size:15px;">${row.period}</strong></td>
          <td>${UI.operatorBadge(row.operator)}</td>
          <td><strong style="color:var(--primary)">${row.source_file}</strong></td>
          <td>
            <div>${row.ticket_count} satır okundu</div>
            ${unmatchedBadge}
          </td>
          <td class="td-muted">${formatCurrency(row.total_kdv)}</td>
          <td class="td-muted">${formatCurrency(row.total_oiv)}</td>
          <td style="font-weight:600; font-size:15px; color:var(--text-main)">${formatCurrency(row.total_payable)}</td>
          <td>
             <div class="action-buttons" style="justify-content:flex-end;">
               <button class="btn btn-secondary btn-sm" onclick="InvoicesPage.loadDetail('${row.period}', '${row.operator}', '${encodeURIComponent(row.source_file)}')">İçeriği Aç</button>
               <button class="btn btn-secondary btn-sm btn-icon" onclick="InvoicesPage.downloadExcel('${row.period}', '${row.operator}', '${encodeURIComponent(row.source_file)}')">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v6H4z"/><path d="M12 10v10"/><path d="M8 14l4 4 4-4"/></svg>
               </button>
             </div>
          </td>
        </tr>`;
      }).join('');
      
      selectedSummaryKeys.clear();
      document.getElementById('summarySelectAll').checked = false;
      updateSummaryBulkBar();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function loadDetail(period, operator, sourceFileEncoded, isMatchedFilter = '') {
    try {
      const card = document.getElementById('invoiceDetailCard');
      const tbody = document.getElementById('invoicesDetailList');
      const sourceFile = decodeURIComponent(sourceFileEncoded);
      
      activePeriod = period;
      activeOperator = operator;
      activeSourceFile = sourceFile;
      
      if (document.getElementById('isMatchedFilter')) {
        document.getElementById('isMatchedFilter').value = isMatchedFilter;
      }
      
      document.getElementById('detailTitle').innerHTML = `<span style="color:var(--text-muted)">${period} ></span> ${sourceFile}`;
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">${UI.loading()}</td></tr>`;
      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth' });

      let url = `/invoices/list?period=${period}&operator=${operator}&source_file=${encodeURIComponent(sourceFile)}`;
      if (isMatchedFilter !== '') url += `&is_matched=${isMatchedFilter}`;
      const res = await API.get(url);
      
      if (!res.length) {
          tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Bu filtreye uygun kayıt bulunamadı.</td></tr>`;
          return;
      }

      tbody.innerHTML = res.map(row => `
         <tr data-id="${row.id}">
           <td><input type="checkbox" class="row-select" value="${row.id}" onchange="InvoicesPage.toggleSelection(${row.id}, this.checked)"></td>
           <td>
             <div style="display:flex;align-items:center;gap:5px">
               <a href="#" onclick="InvoicesPage.showHistory('${row.phone_no}'); return false;" style="text-decoration:none; color:var(--primary); font-weight:600; font-size:14px;">${row.phone_no || '—'}</a>
               ${!row.is_matched ? `<span class="badge badge-danger" style="font-size:10px;padding:1px 4px" title="Sistemde Kayıtlı Değil">!</span>` : ''}
             </div>
           </td>
           <td>
             <div style="display:flex;align-items:center;gap:5px">
               <strong>${row.personnel_name || '—'}</strong>
             </div>
           </td>
           <td>${row.company_name || '—'}</td>
           <td><span class="badge badge-secondary">${row.cost_center || '—'}</span></td>
           <td class="td-muted">${row.tariff || '—'}</td>
           <td class="td-muted" style="font-size:12px">KDV: ${formatCurrency(row.tax_kdv)}<br>ÖİV: ${formatCurrency(row.tax_oiv)}</td>
           <td style="font-weight:600; color:var(--text-main)">${formatCurrency(row.total_amount)}</td>
         </tr>
      `).join('');
      
      selectedInvoiceIds.clear();
      document.getElementById('invoiceSelectAll').checked = false;
      updateBulkBtn();

    } catch (err) {
      UI.toast('İçerik yüklenirken hata oluştu', 'error');
    }
  }

  async function downloadExcel(period, operator, sourceFileEncoded) {
    try {
      const sourceFile = decodeURIComponent(sourceFileEncoded);
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('operator', operator);
      params.append('source_file', sourceFile);

      const res = await fetch(`/api/invoices/export?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('simtrack_token') || ''}` }
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Excel indirilemedi');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fatura-${period}-${sourceFile}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  async function downloadActiveDetail() {
    if (!activePeriod || !activeOperator || !activeSourceFile) return;
    await downloadExcel(activePeriod, activeOperator, encodeURIComponent(activeSourceFile));
  }

  /* --- BULK ACTIONS FOR SUMMARY (DELETE FILE) --- */
  function toggleAllSummaries(selectAll) {
    const cbs = document.querySelectorAll('#invoicesSummaryList .summary-select');
    cbs.forEach(cb => {
      cb.checked = selectAll.checked;
      if (selectAll.checked) selectedSummaryKeys.add(cb.value);
      else selectedSummaryKeys.delete(cb.value);
    });
    updateSummaryBulkBar();
  }

  function toggleSummarySelection(key, checked) {
    if (checked) selectedSummaryKeys.add(key);
    else selectedSummaryKeys.delete(key);
    const cbs = Array.from(document.querySelectorAll('#invoicesSummaryList .summary-select'));
    document.getElementById('summarySelectAll').checked = cbs.every(cb => cb.checked);
    updateSummaryBulkBar();
  }

  function updateSummaryBulkBar() {
    const count = selectedSummaryKeys.size;
    const bar = document.getElementById('summaryBulkActionsBar');
    const countEl = document.getElementById('summarySelectedCount');
    if (bar) bar.style.display = count > 0 ? 'flex' : 'none';
    if (countEl) countEl.textContent = `${count} belge seçildi`;
  }

  function bulkDeleteSummaries() {
    if (!canEditInvoices) return;
    const keys = Array.from(selectedSummaryKeys);
    UI.confirm(`Seçtiğiniz ${keys.length} fatura belgesi ve içindeki tüm satırlar KALICI olarak silinecek. Emin misiniz?`, async () => {
      try {
        const summaries = keys.map(k => {
          const [period, operator, source_file] = k.split('|');
          return { period, operator, source_file };
        });
        await API.post('/invoices/bulk-delete-summaries', { summaries });
        UI.toast('Belgeler başarıyla silindi.');
        document.getElementById('invoiceDetailCard').style.display = 'none';
        loadSummary();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  /* --- BULK ACTIONS FOR DETAIL ROWS --- */
  function toggleAll(selectAll) {
    const cbs = document.querySelectorAll('#invoicesDetailList .row-select');
    cbs.forEach(cb => {
      cb.checked = selectAll.checked;
      const id = parseInt(cb.value);
      if (selectAll.checked) selectedInvoiceIds.add(id);
      else selectedInvoiceIds.delete(id);
    });
    updateBulkBtn();
  }

  function toggleSelection(id, checked) {
    if (checked) selectedInvoiceIds.add(id);
    else selectedInvoiceIds.delete(id);
    const cbs = Array.from(document.querySelectorAll('#invoicesDetailList .row-select'));
    document.getElementById('invoiceSelectAll').checked = cbs.every(cb => cb.checked);
    updateBulkBtn();
  }

  function updateBulkBtn() {
    const count = selectedInvoiceIds.size;
    const bar = document.getElementById('invoiceBulkActionsBar');
    const countEl = document.getElementById('invoiceSelectedCount');
    if (bar) bar.style.display = count > 0 ? 'flex' : 'none';
    if (countEl) countEl.textContent = `${count} satır seçildi`;
  }

  function bulkDelete() {
    if (!canEditInvoices) return;
    const ids = Array.from(selectedInvoiceIds);
    UI.confirm(`Seçili ${ids.length} satır silinecektir. Emin misiniz?`, async () => {
      try {
        await API.post('/invoices/bulk-delete', { ids });
        UI.toast('Satırlar silindi.');
        loadDetail(activePeriod, activeOperator, encodeURIComponent(activeSourceFile));
        loadSummary();
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  async function openBulkEdit() {
    if (!canEditInvoices) return;
    const personnels = await API.get('/personnel');
    const costCenters = [...new Set(personnels.map(p => p.cost_center).filter(Boolean))].sort();
    
    const content = `
      <div class="form-group">
        <label class="form-label">Manuel Masraf Kalemi Atama</label>
        <select id="bulkInvoiceCostCenter" class="form-control">
          <option value="">(Değiştirme)</option>
          ${costCenters.map(cc => `<option value="${cc}">${cc}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Manuel Personel/Zimmet Atama</label>
        <input type="text" id="bulkInvoicePersonName" class="form-control" placeholder="Örn: Serbest Satış">
      </div>
      <small style="color:var(--text-muted)">* Sadece seçili satırlara etki edecektir.</small>
    `;

    UI.confirm(content, async () => {
      const ids = Array.from(selectedInvoiceIds);
      const cost_center = document.getElementById('bulkInvoiceCostCenter').value;
      const personnel_name = document.getElementById('bulkInvoicePersonName').value;
      
      const updates = {};
      if (cost_center) updates.cost_center = cost_center;
      if (personnel_name) updates.personnel_name = personnel_name;
      
      if (Object.keys(updates).length === 0) return;

      try {
        await API.post('/invoices/bulk-edit', { ids, ...updates });
        UI.toast('Seçili satırlar güncellendi.');
        loadDetail(activePeriod, activeOperator, encodeURIComponent(activeSourceFile));
      } catch (err) { UI.toast(err.message, 'error'); }
    }, { title: 'Satırları Manuel Düzenle', okText: 'Uygula' });
  }

  function filterDetail(val) {
    loadDetail(activePeriod, activeOperator, encodeURIComponent(activeSourceFile), val);
  }

  /* --- UPLOAD FLOW --- */
  function renderUploadModal() {
    if (document.getElementById('invoiceUploadModal')) return;
    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.id = 'invoiceUploadModal';
    
    const now = new Date();
    const currMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    div.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Fatura Dosyası Yükle</span>
          <button class="modal-close" onclick="UI.closeModal('invoiceUploadModal')">×</button>
        </div>
        <div class="modal-body">
          <form id="invoiceUploadForm">
             <div class="form-group">
                <label class="form-label required">İlgili Dönem (Ay - Yıl)</label>
                <input type="month" name="period" class="form-control" value="${currMonth}" required>
                <small class="text-muted">Bu dosyalar kaydedilirken ait oldukları dönemi seçmelisiniz.</small>
             </div>
             <div class="form-group" style="display:none;">
                <label class="form-label required">Operatör</label>
                <select name="operator" id="invOperSelect" class="form-control">
                  <option value="Turkcell">Turkcell</option>
                  <option value="Vodafone">Vodafone</option>
                </select>
             </div>
             
             <div class="form-group">
                <label class="form-label required">Fatura Belgeleri (Bağımsız Belge Olarak Eklenecek)</label>
                <div class="file-upload-box" id="invUploadBox">
                   <div style="font-size:32px; margin-bottom:8px;">📄</div>
                   <div style="font-weight:600; font-size:15px; color:var(--text-main);">PDF veya XML Dosyalarını Sürükleyin</div>
                   <div style="font-size:12px; color:var(--text-muted); margin-top:4px; margin-bottom:12px;">Birden fazla dosyayı aynı anda atabilirsiniz. (Ayrı ayrı kaydedilirler)</div>
                   <input type="file" id="invFileInput" name="file" accept=".xml,.pdf" style="display:none;" multiple>
                   <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('invFileInput').click()">Dosya Seç</button>
                   <div id="invFileName" style="margin-top:15px; font-size:13px; font-weight:600; color:var(--accent); background:rgba(var(--accent-rgb), 0.1); padding:8px; border-radius:6px; display:none;"></div>
                </div>
             </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="UI.closeModal('invoiceUploadModal')">İptal</button>
          <button class="btn btn-primary" onclick="InvoicesPage.submitUpload()">Servise Yükle</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    const box = document.getElementById('invUploadBox');
    const inp = document.getElementById('invFileInput');
    const fName = document.getElementById('invFileName');

    const updateFileName = () => {
      if (inp.files.length > 0) {
        fName.style.display = 'block';
        if (inp.files.length === 1) {
          fName.textContent = `✅ 1 Dosya Hazır: ${inp.files[0].name}`;
        } else {
          fName.textContent = `📚 ${inp.files.length} bağımsız dosya seçildi`;
        }
      } else {
        fName.style.display = 'none';
      }
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => box.addEventListener(ev, e => {
       e.preventDefault(); e.stopPropagation();
    }));
    box.addEventListener('dragover', () => {
      box.style.borderColor = 'var(--accent)';
      box.style.background = 'rgba(var(--accent-rgb), 0.05)';
    });
    box.addEventListener('dragleave', () => {
      box.style.borderColor = 'var(--border-color)';
      box.style.background = 'transparent';
    });
    box.addEventListener('drop', e => {
      box.style.borderColor = 'var(--border-color)';
      box.style.background = 'transparent';
      if (e.dataTransfer.files && e.dataTransfer.files.length) {
         inp.files = e.dataTransfer.files;
         updateFileName();
      }
    });
    inp.addEventListener('change', updateFileName);
  }

  function openUploadModal() {
    if (!canEditInvoices) return UI.toast('Fatura yükleme yetkiniz yok.', 'error');
    const form = document.getElementById('invoiceUploadForm');
    form.reset();
    document.getElementById('invFileName').textContent = '';
    const now = new Date();
    form.period.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    UI.openModal('invoiceUploadModal');
  }

  async function submitUpload() {
    if (!canEditInvoices) return;
    const form = document.getElementById('invoiceUploadForm');
    if (!form.reportValidity()) return;
    
    const formData = new FormData(form);
    if (!document.getElementById('invFileInput').files.length) {
       return UI.toast('Lütfen yüklenecek belgeyi seçin', 'error');
    }

    try {
      const res = await API.postFile('/invoices/upload', formData);
      UI.toast(res.message);
      UI.closeModal('invoiceUploadModal');
      loadSummary();
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  /* --- HISTORY MODAL --- */
  async function showHistory(phoneNo) {
    try {
      document.getElementById('historyModalTitle').textContent = `${phoneNo} - Numara Fatura Geçmişi`;
      document.getElementById('historyModalBody').innerHTML = `<div style="padding:20px; text-align:center;">${UI.loading()}</div>`;
      UI.openModal('invoiceHistoryModal');

      const res = await API.get(`/invoices/history/${encodeURIComponent(phoneNo)}`);
      
      const curr = res.current_assignment;
      const history = res.history || [];
      
      let html = `<div style="padding:15px; border-bottom:1px solid var(--border-color); background:var(--bg-body);">
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Akıllı Eşleşme İle Bulunan Sistemdeki Güncel Sahibi:</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${curr && curr.isMatched ? `
            <span class="badge badge-success">Sistemde Kayıtlı</span>
            <strong>${curr.name || '—'}</strong> 
            <span style="color:var(--text-muted)">(${curr.company || '—'})</span>
            <span class="badge badge-secondary">${curr.tariff || '—'}</span>
          ` : `<span class="badge badge-danger">⚠️ Bu numara sim hat havuzunda BULUNAMADI!</span>`}
        </div>
      </div>`;

      if (history.length === 0) {
        html += `<div style="padding:30px; text-align:center; color:var(--text-muted)">Bu numara için arşivde geçmiş fatura kaydı yok.</div>`;
      } else {
        html += `
        <div class="table-container">
          <table class="table" style="margin:0;">
            <thead>
              <tr>
                <th>Dönem</th>
                <th>Belge (Referans Dosya)</th>
                <th>Kime Zimmetliydi</th>
                <th>Şirket</th>
                <th style="text-align:right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(h => `
                <tr ${!h.is_matched ? 'style="background:rgba(var(--danger-rgb), 0.05)"' : ''}>
                  <td><strong style="font-size:14px;">${h.period}</strong></td>
                  <td style="color:var(--primary)">${h.source_file || 'Eski Yükleme'}</td>
                  <td>
                    ${h.personnel_name || '—'}
                    ${!h.is_matched ? `<span title="Fatura döneminde sistemde kayıtlı bulunamadı" style="cursor:help;">⚠️</span>` : ''}
                  </td>
                  <td>${h.company_name || '—'}</td>
                  <td style="text-align:right"><strong>${formatCurrency(h.total_amount)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        `;
      }

      document.getElementById('historyModalBody').innerHTML = html;
    } catch (err) {
      document.getElementById('historyModalBody').innerHTML = `<div style="padding:20px; color:var(--danger); text-align:center;">Hata: ${err.message}</div>`;
    }
  }

  return { render, loadSummary, openUploadModal, submitUpload, loadDetail, filterDetail, downloadExcel, downloadActiveDetail, showHistory, toggleAllSummaries, toggleSummarySelection, bulkDeleteSummaries, toggleAll, toggleSelection, bulkDelete, openBulkEdit };
})();
