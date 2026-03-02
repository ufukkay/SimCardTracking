/* ─── UI UTILITIES ─── */
const UI = (() => {

  // ─── Toast ───
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    el.innerHTML = `<span style="font-size:16px">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('hide');
      el.addEventListener('animationend', () => el.remove());
    }, 3500);
  }

  // ─── Confirm Dialog ───
  function confirm(text, onOk, { title = 'Emin misiniz?', icon = '🗑️', okText = 'Sil', okClass = 'btn-danger' } = {}) {
    const overlay = document.getElementById('confirmModal');
    document.getElementById('confirmIcon').textContent = icon;
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent = text;
    const okBtn = document.getElementById('confirmOk');
    okBtn.textContent = okText;
    okBtn.className = `btn ${okClass}`;
    overlay.classList.add('open');

    const close = () => overlay.classList.remove('open');
    const okHandler = () => { close(); onOk(); cleanup(); };
    const cancelHandler = () => { close(); cleanup(); };
    const cleanup = () => {
      okBtn.removeEventListener('click', okHandler);
      document.getElementById('confirmCancel').removeEventListener('click', cancelHandler);
    };
    okBtn.addEventListener('click', okHandler);
    document.getElementById('confirmCancel').addEventListener('click', cancelHandler);
  }

  // ─── Modal ───
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  // ─── Badge helpers ───
  function statusBadge(status) {
    const map = {
      active:  ['badge-success', 'Aktif'],
      spare:   ['badge-warning', 'Yedek'],
      passive: ['badge-muted',   'Pasif'],
    };
    const [cls, label] = map[status] || ['badge-muted', status];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function operatorBadge(op) {
    const lower = (op || '').toLowerCase().replace(/\s/g,'');
    if (lower.includes('vodafone'))     return `<span class="badge badge-vodafone">${op}</span>`;
    if (lower.includes('turkcell'))     return `<span class="badge badge-turkcell">${op}</span>`;
    if (lower.includes('t&#252;rktelekom') || lower.includes('turktelekom') || lower.includes('türktelekom'))
                                        return `<span class="badge badge-turktelekom">${op}</span>`;
    return `<span class="badge badge-muted">${op}</span>`;
  }

  // ─── Empty state ───
  function emptyState(icon = '📭', text = 'Kayıt bulunamadı', sub = '') {
    return `<div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-text">${text}</div>
      ${sub ? `<div class="empty-state-sub">${sub}</div>` : ''}
    </div>`;
  }

  // ─── Loading ───
  function loading() {
    return `<div class="loading-overlay"><div class="spinner"></div></div>`;
  }

  // ─── Fill select with operators ───
  async function fillOperatorSelect(selectEl) {
    try {
      const ops = await API.getOperators();
      selectEl.innerHTML = '<option value="">Operatör seçin...</option>' +
        ops.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
    } catch { selectEl.innerHTML = '<option>Yüklenemedi</option>'; }
  }

  // ─── Form to object ───
  function formData(formId) {
    const form = document.getElementById(formId);
    const data = {};
    form.querySelectorAll('[name]').forEach(el => {
      data[el.name] = el.value.trim() || null;
    });
    return data;
  }

  // ─── Set form values ───
  function setForm(formId, obj) {
    const form = document.getElementById(formId);
    Object.entries(obj).forEach(([key, val]) => {
      const el = form.querySelector(`[name="${key}"]`);
      if (el) el.value = val ?? '';
    });
  }

  // ─── Sort rows client-side ───
  function sortRows(rows, sortState, colDefs) {
    if (!sortState || !sortState.col || !sortState.dir) return rows;
    const colDef = colDefs[sortState.col];
    if (!colDef) return rows;
    const dir = sortState.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = (colDef.getVal(a) || '').toString();
      const vb = (colDef.getVal(b) || '').toString();
      return dir * va.localeCompare(vb, 'tr', { sensitivity: 'base', numeric: true });
    });
  }

  // ─── Excel-like Column Filters + Sorting (Global) ───
  // colDef = { 'operator': { label: 'Operatör', getVal: row => row.operator } }
  // storageObj = object where filters are kept (e.g. M2MPage.colFilters)
  // onApply = callback to trigger data refresh
  function setupTableFilters(tableBodyId, currentRows, filterStateObj, colDefs, onApply) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const ths = tbody.closest('table').querySelectorAll('th');

    ths.forEach(th => {
      const text = th.textContent.trim().replace(/[↕↑↓]/g, '').trim().toLowerCase();
      
      // Find matching column definition based on th text
      const colKey = Object.keys(colDefs).find(k => (colDefs[k].label || '').toLowerCase() === text);
      if (!colKey) return;
      
      const colDef = colDefs[colKey];
      
      // Cleanup previous injects
      if (th.querySelector('.th-filter-btn')) {
         th.querySelector('.th-filter-btn').remove();
         if (th.querySelector('.col-filter-menu')) th.querySelector('.col-filter-menu').remove();
      }
      if (th.querySelector('.th-sort-btn')) th.querySelector('.th-sort-btn').remove();

      // ── Sort button ──
      const sortState = filterStateObj._sort || {};
      const isSortedAsc  = sortState.col === colKey && sortState.dir === 'asc';
      const isSortedDesc = sortState.col === colKey && sortState.dir === 'desc';
      const sortIcon = isSortedAsc ? '↑' : isSortedDesc ? '↓' : '↕';

      const sortBtn = document.createElement('button');
      sortBtn.className = `th-sort-btn${(isSortedAsc || isSortedDesc) ? ' active' : ''}`;
      sortBtn.textContent = sortIcon;
      sortBtn.title = 'Sırala';
      sortBtn.onclick = (e) => {
        e.stopPropagation();
        if (!filterStateObj._sort) filterStateObj._sort = {};
        if (filterStateObj._sort.col !== colKey) {
          filterStateObj._sort = { col: colKey, dir: 'asc' };
        } else if (filterStateObj._sort.dir === 'asc') {
          filterStateObj._sort.dir = 'desc';
        } else {
          filterStateObj._sort = {};
        }
        onApply();
      };

      // Unique values from all currently fetched rows
      let rawValues = currentRows.map(r => colDef.getVal(r));
      let uniqueVals = [...new Set(rawValues)].filter(v => v !== '—' && v !== '' && v !== null && v !== undefined);
      uniqueVals.sort();

      const isActive = filterStateObj && filterStateObj[colKey] && filterStateObj[colKey].length > 0;
      
      const btn = document.createElement('button');
      btn.className = `th-filter-btn ${isActive ? 'active' : ''}`;
      btn.innerHTML = '⋮';
      btn.title = 'Filtrele';
      btn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.col-filter-menu').forEach(m => m !== menu && m.classList.remove('open'));
        menu.classList.toggle('open');
      };

      const menu = document.createElement('div');
      menu.className = 'col-filter-menu';
      
      // Search Input
      const searchInp = document.createElement('input');
      searchInp.className = 'form-control';
      searchInp.placeholder = 'Ara...';
      searchInp.onclick = e => e.stopPropagation();
      searchInp.onkeyup = (e) => {
         const q = e.target.value.toLowerCase();
         menu.querySelectorAll('.col-filter-item').forEach(item => {
            const txt = item.querySelector('span').innerText.toLowerCase();
            item.style.display = txt.includes(q) ? 'flex' : 'none';
         });
      };
      
      // Values List
      const list = document.createElement('div');
      list.className = 'col-filter-list';
      uniqueVals.forEach(val => {
         const isChecked = isActive && filterStateObj[colKey].includes(val);
         list.innerHTML += `
           <label class="col-filter-item" onclick="event.stopPropagation()">
             <input type="checkbox" value="${val}" ${isChecked ? 'checked' : ''}>
             <span title="${val}">${val}</span>
           </label>
         `;
      });
      if (uniqueVals.length === 0) list.innerHTML = '<div style="padding:4px;color:var(--text-muted)">Kayıt yok</div>';

      // Action Buttons
      const acts = document.createElement('div');
      acts.className = 'col-filter-actions';
      
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-ghost btn-sm';
      clearBtn.innerText = 'Temizle';
      clearBtn.onclick = (e) => {
         e.stopPropagation();
         if (!filterStateObj[colKey]) filterStateObj[colKey] = [];
         filterStateObj[colKey] = [];
         menu.classList.remove('open');
         onApply();
      };
      
      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn btn-primary btn-sm';
      applyBtn.innerText = 'Uygula';
      applyBtn.onclick = (e) => {
         e.stopPropagation();
         const checked = Array.from(list.querySelectorAll('input:checked')).map(cb => cb.value);
         filterStateObj[colKey] = checked;
         menu.classList.remove('open');
         onApply();
      };
      
      acts.appendChild(clearBtn);
      acts.appendChild(applyBtn);

      menu.appendChild(searchInp);
      menu.appendChild(list);
      menu.appendChild(acts);
      
      th.appendChild(sortBtn);
      th.appendChild(btn);
      th.appendChild(menu);
    });
    
    // Close menus on outside click
    document.addEventListener('click', () => {
       document.querySelectorAll('.col-filter-menu').forEach(m => m.classList.remove('open'));
    }, { once: true });
  }

  // Filter local rows using the given state
  function filterRows(rows, filterStateObj, colDefs) {
    if (!filterStateObj) return rows;
    let filtered = rows;
    Object.keys(filterStateObj).forEach(colKey => {
      const activeFilters = filterStateObj[colKey];
      if (activeFilters && activeFilters.length > 0 && colDefs[colKey]) {
        filtered = filtered.filter(row => {
          const val = colDefs[colKey].getVal(row);
          return activeFilters.includes(val);
        });
      }
    });
    return filtered;
  }

  // ─── Selection Helpers ───
  function initSelection(tableBodyId, selectAllId, onSelectionChange) {
    const tbody = document.getElementById(tableBodyId);
    const selectAll = document.getElementById(selectAllId);
    if (!tbody || !selectAll) return;

    selectAll.checked = false;
    
    selectAll.onchange = () => {
      const cbs = tbody.querySelectorAll('input[type="checkbox"].row-select');
      cbs.forEach(cb => cb.checked = selectAll.checked);
      onSelectionChange(getSelectedIds(tableBodyId));
    };

    tbody.onchange = (e) => {
      if (e.target.classList.contains('row-select')) {
        const cbs = Array.from(tbody.querySelectorAll('input[type="checkbox"].row-select'));
        selectAll.checked = cbs.every(cb => cb.checked);
        onSelectionChange(getSelectedIds(tableBodyId));
      }
    };
  }

  function getSelectedIds(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('input[type="checkbox"].row-select:checked'))
                .map(cb => parseInt(cb.value));
  }

  return { toast, confirm, openModal, closeModal, statusBadge, operatorBadge, emptyState, loading, fillOperatorSelect, formData, setForm, sortRows, setupTableFilters, filterRows, initSelection, getSelectedIds };
})();
