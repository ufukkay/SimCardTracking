/* ─── FATURA ANALİZİ SAYFASI ─── */
const InvoicesPage = (() => {
  let canEditInvoices = true;
  let selectedInvoiceIds = new Set();
  let selectedSummaryKeys = new Set();
  let currentPeriod = null;
  let currentOperator = null;
  let currentCompanyName = null;

  function render() {
    canEditInvoices = window.AppPerms?.canEdit ? window.AppPerms.canEdit('invoices') : true;
    document.getElementById('pageTitle').textContent = i18n.t('nav_invoices') || 'Faturalar';
    document.getElementById('topbarActions').innerHTML = canEditInvoices ? `
      <button class="btn btn-primary" onclick="InvoicesPage.openUploadModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>Fatura Yükle</span>
      </button>
    ` : '';

    document.getElementById('pageContent').innerHTML = `
      <div id="invoicesDashboard">
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header">
            <h3 class="card-title">Fatura Dönem Özetleri</h3>
            <div id="summaryBulkActionsBar" class="bulk-actions-bar" style="display:none; margin-left:auto">
              <span id="summarySelectedCount">0 kayıt seçildi</span>
              <div class="bulk-buttons">
                <button class="btn btn-danger btn-sm" onclick="InvoicesPage.bulkDeleteSummaries()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  <span>Münferit Sil</span>
                </button>
              </div>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width:32px"><input type="checkbox" id="summarySelectAll" onclick="InvoicesPage.toggleAllSummaries(this)"></th>
                  <th>Dönem</th>
                  <th>Operatör</th>
                  <th>Şirket / Fatura</th>
                  <th>Kayıt Sayısı</th>
                  <th>KDV Toplamı</th>
                  <th>ÖİV Toplamı</th>
                  <th>Ödenecek Tutar</th>
                  <th style="width:120px;text-align:right">İşlem</th>
                </tr>
              </thead>
              <tbody id="invoicesSummaryList">
                <tr><td colspan="8" style="text-align:center">${i18n.t('loading') || 'Yükleniyor...'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card" style="display:none" id="invoiceDetailCard">
          <div class="card-header">
             <h3 class="card-title" id="detailTitle">Fatura Detayları</h3>
             <div id="invoiceBulkActionsBar" class="bulk-actions-bar" style="display:none; margin-left:auto">
                <span id="invoiceSelectedCount">0 kayıt seçildi</span>
                <div class="bulk-buttons">
                  <button class="btn btn-secondary btn-sm btn-icon" onclick="InvoicesPage.openBulkEdit()">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Toplu Düzenle</span>
                  </button>
                  <button class="btn btn-danger btn-sm btn-icon" onclick="InvoicesPage.bulkDelete()">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    <span>Toplu Sil</span>
                  </button>
                </div>
             </div>
             <button class="btn btn-secondary btn-sm" onclick="document.getElementById('invoiceDetailCard').style.display='none'">Kapat</button>
          </div>
          <div class="table-container">
            <table>
              <thead>
                 <tr>
                    <th style="width:32px"><input type="checkbox" id="invoiceSelectAll" onclick="InvoicesPage.toggleAll(this)"></th>
                    <th>Personel</th>
                    <th>Şirket</th>
                    <th>Masraf Kalemi</th>
                    <th>Telefon No</th>
                    <th>Tarife</th>
                    <th>Fatura Tutarı</th>
                    <th>KDV / ÖİV</th>
                    <th>Ödenecek Tutar</th>
                 </tr>
              </thead>
              <tbody id="invoicesDetailList">
              </tbody>
            </table>
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
      const tbody = document.getElementById('invoicesSummaryList');
      if (!res || res.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">${UI.emptyState('📄', 'Henüz fatura yüklenmedi', 'Yukarıdaki butonu kullanarak Excel faturanızı içe aktarabilirsiniz.')}</td></tr>`;
        return;
      }
      
      tbody.innerHTML = res.map(row => {
        const key = `${row.period}|${row.operator}|${row.company_name || ''}`;
        return `
        <tr>
          <td><input type="checkbox" class="summary-select" value="${key}" onchange="InvoicesPage.toggleSummarySelection('${key}', this.checked)"></td>
          <td><strong>${row.period}</strong></td>
          <td>${UI.operatorBadge(row.operator)}</td>
          <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${row.company_name || ''}">${row.company_name || '—'}</td>
          <td><span class="badge badge-info">${row.ticket_count} satır</span></td>
          <td class="td-muted">${formatCurrency(row.total_kdv)}</td>
          <td class="td-muted">${formatCurrency(row.total_oiv)}</td>
          <td style="font-weight:600; font-size:15px; color:var(--text-main)">${formatCurrency(row.total_payable)}</td>
          <td>
             <div class="action-buttons" style="justify-content:flex-end;">
               <button class="btn btn-secondary btn-sm btn-icon" onclick="InvoicesPage.loadDetail('${row.period}', '${row.operator}', '${encodeURIComponent(row.company_name || '')}')" title="Detayları Gör">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
               </button>
               <button class="btn btn-secondary btn-sm btn-icon" onclick="InvoicesPage.downloadExcel('${row.period}', '${row.operator}', '${encodeURIComponent(row.company_name || '')}')" title="Excel İndir">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16v6H4z"/><path d="M12 10v10"/><path d="M8 14l4 4 4-4"/></svg>
               </button>
                ${canEditInvoices ? `<button class="btn btn-danger btn-sm btn-icon" onclick="InvoicesPage.deletePeriod('${row.period}', '${row.operator}', '${encodeURIComponent(row.company_name || '')}')" title="Sil">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>` : ''}
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

  async function loadDetail(period, operator, companyNameEncoded) {
    try {
      const card = document.getElementById('invoiceDetailCard');
      const tbody = document.getElementById('invoicesDetailList');
      const companyName = companyNameEncoded ? decodeURIComponent(companyNameEncoded) : '';
      
      currentPeriod = period;
      currentOperator = operator;
      currentCompanyName = companyName;
      
       document.getElementById('detailTitle').textContent = `${period} Dönemi ${operator}${companyName ? ' — ' + companyName : ''} Fatura Detayları`;
       tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">${UI.loading()}</td></tr>`;
      card.style.display = 'block';
      
      card.scrollIntoView({ behavior: 'smooth' });

      let url = `/invoices/list?period=${period}&operator=${operator}`;
      if (companyName) url += `&company_name=${encodeURIComponent(companyName)}`;
      const res = await API.get(url);
      
       if (!res.length) {
           tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Bu döneme ait fatura bulunamadı.</td></tr>`;
          return;
      }

      tbody.innerHTML = res.map(row => `
         <tr data-id="${row.id}">
           <td><input type="checkbox" class="row-select" value="${row.id}" onchange="InvoicesPage.toggleSelection(${row.id}, this.checked)"></td>
           <td><strong>${row.personnel_name || '—'}</strong></td>
           <td>${row.company_name || '—'}</td>
           <td><span class="badge badge-secondary">${row.cost_center || '—'}</span></td>
           <td>${row.phone_no || '—'}</td>
           <td class="td-muted">${row.tariff || '—'}</td>
           <td>${formatCurrency(row.amount)}</td>
           <td class="td-muted" style="font-size:12px">KDV: ${formatCurrency(row.tax_kdv)}<br>ÖİV: ${formatCurrency(row.tax_oiv)}</td>
           <td style="font-weight:600; color:var(--text-main)">${formatCurrency(row.total_amount)}</td>
         </tr>
      `).join('');
      
      selectedInvoiceIds.clear();
      document.getElementById('invoiceSelectAll').checked = false;
      updateBulkBtn();

    } catch (err) {
      UI.toast('Detaylar yüklenirken hata oluştu', 'error');
    }
  }

  function deletePeriod(period, operator, companyNameEncoded) {
    if (!canEditInvoices) return UI.toast('Silme yetkiniz yok.', 'error');
    const companyName = companyNameEncoded ? decodeURIComponent(companyNameEncoded) : '';
    const label = companyName ? `<strong>${companyName}</strong> faturası` : `<strong>${operator}</strong> tüm faturaları`;
    UI.confirm(`<strong>${period}</strong> dönemi ${label} silinecektir. Emin misiniz?`, async () => {
      try {
        const qs = companyName ? `?company_name=${encodeURIComponent(companyName)}` : '';
        await API.delete(`/invoices/${period}/${operator}${qs}`);
        UI.toast('Faturalar başarıyla silindi.');
        document.getElementById('invoiceDetailCard').style.display = 'none';
        loadSummary();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });
  }

  async function downloadExcel(period, operator, companyNameEncoded) {
    try {
      const companyName = companyNameEncoded ? decodeURIComponent(companyNameEncoded) : '';
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (operator) params.append('operator', operator);
      if (companyName) params.append('company_name', companyName);

      const res = await fetch(`/api/invoices/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('simtrack_token') || ''}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Excel indirilemedi');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safePeriod = period || 'tum';
      const safeOperator = operator || 'tum';
      a.download = `${safeOperator}-${safePeriod}-faturalar.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      UI.toast('Excel indiriliyor...');
    } catch (err) {
      UI.toast(err.message || 'Excel indirilirken hata oluştu', 'error');
    }
  }

  async function showCostCenterBreakdown(period, operator) {
    try {
      const invoices = await API.get(`/invoices/list?period=${period}&operator=${operator}`);
      
      const breakdown = {};
      let totalAmount = 0;
      
      invoices.forEach(inv => {
        const costCenter = inv.cost_center || 'Bilinmiyor';
        if (!breakdown[costCenter]) breakdown[costCenter] = 0;
        breakdown[costCenter] += inv.total_amount;
        totalAmount += inv.total_amount;
      });

      const sortedBreakdown = Object.entries(breakdown).sort((a,b) => b[1] - a[1]);

      let html = `<table class="table">
        <thead>
          <tr>
            <th>Masraf Kalemi</th>
            <th style="text-align:right">Tutar</th>
            <th style="text-align:right">Yüzde</th>
          </tr>
        </thead>
        <tbody>
      `;
      
      sortedBreakdown.forEach(([cc, amount]) => {
        const pct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
        html += `
          <tr>
            <td><strong>${cc}</strong></td>
            <td style="text-align:right">${formatCurrency(amount)}</td>
            <td style="text-align:right">
               <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px">
                 <div style="width:50px;height:6px;background:var(--border-color);border-radius:3px;overflow:hidden">
                   <div style="height:100%;width:${pct}%;background:var(--primary)"></div>
                 </div>
                 <span style="width:40px">${pct}%</span>
               </div>
            </td>
          </tr>
        `;
      });
      html += `
          <tr style="background:var(--bg-body);font-weight:bold">
            <td>TOPLAM</td>
            <td style="text-align:right">${formatCurrency(totalAmount)}</td>
            <td style="text-align:right">100.0%</td>
          </tr>
        </tbody></table>
      `;

      Swal.fire({
        title: `${operator} - ${period} Masraf Dağılımı`,
        html: html,
        width: 600,
        confirmButtonText: 'Kapat',
      });
    } catch (e) {
      UI.toast(e.message, 'error');
    }
  }

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
                <label class="form-label required">Fatura Dönemi</label>
                <input type="month" name="period" class="form-control" value="${currMonth}" required>
             </div>
             <div class="form-group">
                <label class="form-label required">Operatör</label>
                <select name="operator" id="invOperSelect" class="form-control" required>
                </select>
             </div>
             <div class="form-group">
                <label class="form-label required">Fatura Dosyaları (PDF, XML, HTML, Excel)</label>
                <div class="file-upload-box" id="invUploadBox">
                   <div style="font-size:32px; margin-bottom:8px;">📂</div>
                   <div style="font-weight:600; font-size:15px; color:var(--text-main);">Dosyaları buraya sürükleyin</div>
                   <div style="font-size:12px; color:var(--text-muted); margin-top:4px; margin-bottom:12px;">veya seçmek için tıklayın (Toplu seçim yapabilirsiniz)</div>
                   <input type="file" id="invFileInput" name="file" accept=".xlsx, .xls, .xml, .html, .pdf" style="display:none;" multiple required>
                   <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('invFileInput').click()">Dosyaları Seç</button>
                   <div id="invFileName" style="margin-top:15px; font-size:13px; font-weight:600; color:var(--accent); background:rgba(var(--accent-rgb), 0.1); padding:8px; border-radius:6px; display:none;"></div>
                </div>
             </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="UI.closeModal('invoiceUploadModal')">İptal</button>
          <button class="btn btn-primary" onclick="InvoicesPage.submitUpload()">Yükle ve Aktar</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    // File Drop UI
    const box = document.getElementById('invUploadBox');
    const inp = document.getElementById('invFileInput');
    const fName = document.getElementById('invFileName');

    const updateFileName = () => {
      if (inp.files.length > 0) {
        fName.style.display = 'block';
        if (inp.files.length === 1) {
          fName.textContent = `📄 ${inp.files[0].name}`;
        } else {
          fName.textContent = `📚 ${inp.files.length} adet dosya seçildi`;
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
    API.getOperators().then(ops => {
       const sel = document.getElementById('invOperSelect');
       sel.innerHTML = '<option value="">Seçiniz...</option>' + ops.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
    });
    const form = document.getElementById('invoiceUploadForm');
    form.reset();
    document.getElementById('invFileName').textContent = '';
    
    // Default current month
    const now = new Date();
    form.period.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    UI.openModal('invoiceUploadModal');
  }

  async function submitUpload() {
    if (!canEditInvoices) return UI.toast('Fatura yükleme yetkiniz yok.', 'error');
    const form = document.getElementById('invoiceUploadForm');
    if (!form.reportValidity()) return;
    
    const formData = new FormData(form);
    if (!document.getElementById('invFileInput').files.length) {
       return UI.toast('Lütfen bir dosya seçin', 'error');
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
    if (count > 0) {
      if (bar) bar.style.display = 'flex';
      if (countEl) countEl.textContent = `${count} kayıt seçildi`;
    } else {
      if (bar) bar.style.display = 'none';
    }
  }

  function bulkDelete() {
    if (!canEditInvoices) return;
    const ids = Array.from(selectedInvoiceIds);
    UI.confirm(`Seçili ${ids.length} adet fatura kaydı silinecektir. Emin misiniz?`, async () => {
      try {
        await API.post('/invoices/bulk-delete', { ids });
        UI.toast('Seçili kayıtlar silindi.');
        loadDetail(currentPeriod, currentOperator, currentCompanyName ? encodeURIComponent(currentCompanyName) : '');
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
        <label class="form-label">Yeni Masraf Kalemi</label>
        <select id="bulkInvoiceCostCenter" class="form-control">
          <option value="">Değiştirme</option>
          ${costCenters.map(cc => `<option value="${cc}">${cc}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Yeni Personel Adı (Opsiyonel)</label>
        <input type="text" id="bulkInvoicePersonName" class="form-control" placeholder="Tüm seçili için aynı ismi ata...">
      </div>
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
        UI.toast('Seçili kayıtlar güncellendi.');
        loadDetail(currentPeriod, currentOperator, currentCompanyName ? encodeURIComponent(currentCompanyName) : '');
      } catch (err) { UI.toast(err.message, 'error'); }
    }, { title: 'Toplu Düzenle', icon: '📝', okText: 'Güncelle', okClass: 'btn-primary' });
  }

  function toggleAllSummaries(selectAll) {
    const cbs = document.querySelectorAll('#invoicesSummaryList .summary-select');
    cbs.forEach(cb => {
      cb.checked = selectAll.checked;
      const key = cb.value;
      if (selectAll.checked) selectedSummaryKeys.add(key);
      else selectedSummaryKeys.delete(key);
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
    if (count > 0) {
      if (bar) bar.style.display = 'flex';
      if (countEl) countEl.textContent = `${count} özet seçildi`;
    } else {
      if (bar) bar.style.display = 'none';
    }
  }

  function bulkDeleteSummaries() {
    if (!canEditInvoices) return;
    const keys = Array.from(selectedSummaryKeys);
    UI.confirm(`Seçili ${keys.length} adet fatura dönemi/özeti silinecektir. Tüm alt kayıtlar da silinecektir. Emin misiniz?`, async () => {
      try {
        const summaries = keys.map(k => {
          const [period, operator, company_name] = k.split('|');
          return { period, operator, company_name };
        });
        await API.post('/invoices/bulk-delete-summaries', { summaries });
        UI.toast('Seçili özetler silindi.');
        loadSummary();
        document.getElementById('invoiceDetailCard').style.display = 'none';
      } catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  return { render, loadSummary, openUploadModal, submitUpload, loadDetail, deletePeriod, downloadExcel, toggleAll, toggleSelection, bulkDelete, openBulkEdit, toggleAllSummaries, toggleSummarySelection, bulkDeleteSummaries };
})();
