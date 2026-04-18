/* ─── SIM SAYFA ORTAK YARDIMCILARI ─── */
const SimPageBase = (() => {

  const EDIT_SVG  = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const DEL_SVG   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
  const EXCEL_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;

  function setNormalTopbar() {
    document.getElementById('topbarActions').innerHTML = '';
  }

  function setBulkTopbar(ids, pageName, permission) {
    const canEdit = window.AppPerms?.canEdit(permission);
    document.getElementById('topbarActions').innerHTML = `
      <span style="font-size:13px;font-weight:600;color:var(--accent);background:var(--accent-light);padding:4px 12px;border-radius:20px;border:1px solid rgba(26,115,232,0.2);white-space:nowrap">${ids.length} kayıt seçildi</span>
      ${canEdit ? `<button class="btn btn-secondary btn-sm" onclick="${pageName}.openBulkEdit()">${EDIT_SVG} Toplu Düzenle</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="${pageName}.exportSelectedExcel()">${EXCEL_SVG} Excel İndir</button>
      ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="${pageName}.bulkDel()">${DEL_SVG} Toplu Sil</button>` : ''}
      <button class="btn btn-ghost btn-sm" onclick="${pageName}.clearSelection()" style="color:var(--text-muted)">✕ Temizle</button>
    `;
  }

  function renderStats(elementId, rows) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const active  = rows.filter(r => r.status === 'active').length;
    const spare   = rows.filter(r => r.status === 'spare').length;
    const passive = rows.filter(r => r.status === 'passive').length;
    el.innerHTML = `
      <span class="stat-chip stat-chip-total">Toplam: <strong>${rows.length}</strong></span>
      <span class="stat-chip stat-chip-active">Aktif: <strong>${active}</strong></span>
      ${spare   ? `<span class="stat-chip stat-chip-spare">Yedek: <strong>${spare}</strong></span>` : ''}
      ${passive ? `<span class="stat-chip stat-chip-passive">Pasif: <strong>${passive}</strong></span>` : ''}
    `;
  }

  function clearSelection(tableBodyId, selectAllId) {
    document.querySelectorAll(`#${tableBodyId} .row-select`).forEach(cb => cb.checked = false);
    const sa = document.getElementById(selectAllId);
    if (sa) sa.checked = false;
    setNormalTopbar();
  }

  function exportToExcel(rows, mapFn, filename, sheetname) {
    if (!rows.length) { UI.toast('Dışa aktarılacak veri bulunamadı.', 'info'); return; }
    if (typeof XLSX === 'undefined') { UI.toast('Excel kütüphanesi yüklenemedi.', 'error'); return; }
    const data = rows.map(mapFn);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto spacing roughly
    const cols = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 15) }));
    ws['!cols'] = cols.length ? cols : undefined;

    XLSX.utils.book_append_sheet(wb, ws, sheetname);
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    UI.toast(`${rows.length} kayıt Excel'e aktarıldı.`, 'success');
  }

  function del(id, label, apiFn, onSuccess) {
    UI.confirm(`"${label}" kaydı silinecek. Bu işlem geri alınamaz.`, async () => {
      try { await apiFn(id); UI.toast('Kayıt silindi.', 'success'); onSuccess(); }
      catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  function openBulkEdit(tableBodyId, formId, countId, modalId) {
    const ids = UI.getSelectedIds(tableBodyId);
    if (!ids.length) return UI.toast('Önce kayıt seçin', 'warning');
    document.getElementById(formId).reset();
    document.getElementById(countId).textContent = ids.length;
    UI.openModal(modalId);
  }

  async function saveBulk(e, tableBodyId, formId, saveBtnId, modalId, apiFn, onSuccess) {
    e.preventDefault();
    const ids = UI.getSelectedIds(tableBodyId);
    const formData = UI.formData(formId);
    const data = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] === '__CLEAR__') data[key] = null;
      else if (formData[key]) data[key] = formData[key];
    });
    if (!Object.keys(data).length) { UI.toast('Güncellenecek herhangi bir alan doldurmadınız.', 'info'); return; }
    const btn = document.getElementById(saveBtnId);
    btn.disabled = true;
    try {
      await apiFn(ids, data);
      UI.toast(`${ids.length} kayıt başarıyla güncellendi.`, 'success');
      UI.closeModal(modalId);
      onSuccess();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { btn.disabled = false; }
  }

  function bulkDel(tableBodyId, apiFn, onSuccess) {
    const ids = UI.getSelectedIds(tableBodyId);
    if (!ids.length) return;
    UI.confirm(`Seçilen ${ids.length} kayıt silinecek. Bu işlem geri alınamaz.`, async () => {
      try { await apiFn(ids); UI.toast(`${ids.length} kayıt silindi.`, 'success'); onSuccess(); }
      catch (err) { UI.toast(err.message, 'error'); }
    });
  }

  function renderPagination(elementId, { totalRecords, totalPages, currentPage }, onPageClickFnName) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (totalPages <= 1) {
      el.innerHTML = '';
      return;
    }

    let html = `<div class="pagination-controls" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-top:1px solid var(--border); font-size:13.5px;">
      <div style="color:var(--text-muted)">Toplam ${totalRecords} kayıt (Sayfa ${currentPage} / ${totalPages})</div>
      <div style="display:flex; gap:5px;">`;

    if (currentPage > 1) {
      html += `<button class="btn btn-secondary btn-sm" onclick="${onPageClickFnName}(${currentPage - 1})">Önceki</button>`;
    }
    
    // Simple window
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    for(let i=start; i<=end; i++) {
        html += `<button class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="${onPageClickFnName}(${i})">${i}</button>`;
    }

    if (currentPage < totalPages) {
      html += `<button class="btn btn-secondary btn-sm" onclick="${onPageClickFnName}(${currentPage + 1})">Sonraki</button>`;
    }

    html += `</div></div>`;
    el.innerHTML = html;
  }

  return { setNormalTopbar, setBulkTopbar, renderStats, clearSelection, exportToExcel, del, openBulkEdit, saveBulk, bulkDel, renderPagination };
})();
