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
    document.getElementById('confirmText').innerHTML = text;
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
      active:  ['badge-success', i18n.t('status_active')],
      spare:   ['badge-warning', i18n.t('status_spare')],
      passive: ['badge-muted',   i18n.t('status_passive')],
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
  function emptyState(icon = '📭', text = null, sub = '') {
    return `<div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-text">${text || i18n.t('no_records')}</div>
      ${sub ? `<div class="empty-state-sub">${sub}</div>` : ''}
    </div>`;
  }

  // ─── Loading ───
  function loading() {
    return `<div class="loading-overlay"><div class="spinner"></div><div style="margin-top:10px">${i18n.t('loading')}</div></div>`;
  }

  // ─── Fill select with operators ───
  async function fillOperatorSelect(selectEl) {
    try {
      const ops = await API.getOperators();
      selectEl.innerHTML = `<option value="">${i18n.t('select_operator')}</option>` +
        ops.map(o => `<option value="${o.name}">${o.name}</option>`).join('');
    } catch { selectEl.innerHTML = `<option>${i18n.t('select_operator')}</option>`; }
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
  function setupTableFilters(tableBodyId, unfilteredRows, filterStateObj, colDefs, onApply) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    const ths = tbody.closest('table').querySelectorAll('th');

    ths.forEach(th => {
      // Try to get colKey from attribute first, because th.textContent includes all menu text after first render
      let colKey = th.getAttribute('data-col-key');
      if (!colKey) {
        let text = th.textContent.trim();
        // If it already has a label, extract just that
        if (th.querySelector('.th-label')) {
          text = th.querySelector('.th-label').textContent.trim();
        } else {
          // Otherwise clean up first load raw text
          text = text.replace(/[↕↑↓⋮]/g, '').trim();
        }
        colKey = Object.keys(colDefs).find(k => (colDefs[k].label || '').toLowerCase() === text.toLowerCase());
        if (colKey) th.setAttribute('data-col-key', colKey);
      }
      if (!colKey) return;
      
      const colDef = colDefs[colKey];
      
      // Cleanup / Re-init buttons only if they don't exist
      // Clear and rebuild TH content for better alignment
      th.innerHTML = '';
      
      const headerWrap = document.createElement('div');
      headerWrap.className = 'th-content';
      
      const label = document.createElement('span');
      label.className = 'th-label';
      label.textContent = colDef.label;
      headerWrap.appendChild(label);

      const btnGroup = document.createElement('div');
      btnGroup.className = 'th-btn-group';

      let filterBtn;
      let menu;

      if (colDef.filterable !== false) {
        filterBtn = document.createElement('button');
        filterBtn.type = 'button';
        filterBtn.className = 'th-filter-btn';
        filterBtn.innerHTML = '⋮';
        filterBtn.title = i18n.t('filter');
        btnGroup.appendChild(filterBtn);

        menu = document.createElement('div');
        menu.className = 'col-filter-menu';
        th.appendChild(menu);
      }

      const sortBtn = document.createElement('button');
      sortBtn.type = 'button';
      sortBtn.className = 'th-sort-btn';
      sortBtn.title = i18n.t('sort');
      btnGroup.appendChild(sortBtn);

      headerWrap.appendChild(btnGroup);
      th.appendChild(headerWrap);

      // ── Sort logic ──
      const sortState = filterStateObj._sort || {};
      const isSortedAsc  = sortState.col === colKey && sortState.dir === 'asc';
      const isSortedDesc = sortState.col === colKey && sortState.dir === 'desc';
      sortBtn.textContent = isSortedAsc ? '↑' : isSortedDesc ? '↓' : '↕';
      sortBtn.className = `th-sort-btn${(isSortedAsc || isSortedDesc) ? ' active' : ''}`;
      
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

      // ── Filter logic ──
      const isActive = filterStateObj && filterStateObj[colKey] && filterStateObj[colKey].length > 0;
      filterBtn.className = `th-filter-btn ${isActive ? 'active' : ''}`;
      filterBtn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.col-filter-menu').forEach(m => m !== menu && m.classList.remove('open'));
        menu.classList.toggle('open');
      };

      // Calculate available unique values for THIS column, by applying all OTHER active filters
      let rowsForThisCol = unfilteredRows;
      if (filterStateObj) {
        Object.keys(filterStateObj).forEach(otherColKey => {
          if (otherColKey !== colKey && otherColKey !== '_sort') {
            const activeFilters = filterStateObj[otherColKey];
            if (activeFilters && activeFilters.length > 0 && colDefs[otherColKey]) {
              rowsForThisCol = rowsForThisCol.filter(r => {
                const val = colDefs[otherColKey].getVal(r);
                return activeFilters.includes(val);
              });
            }
          }
        });
      }

      const EMPTY_VAL = '__EMPTY__';
      let rawValues = rowsForThisCol.map(r => colDef.getVal(r));
      let uniqueVals = [...new Set(rawValues)].filter(v => v !== '\u2014' && v !== '' && v !== null && v !== undefined);
      uniqueVals.sort();

      const hasEmpty = rawValues.some(v => v === '\u2014' || v === '' || v === null || v === undefined);
      const emptyLabel = i18n.t('filter_empty') || '(Bo\u015f)';
      const emptyChecked = isActive && filterStateObj[colKey].includes(EMPTY_VAL);

      menu.innerHTML = `
        <div class="col-filter-search">
          <input type="text" class="form-control" placeholder="${i18n.t('search_placeholder_short')}" onclick="event.stopPropagation()">
        </div>
        <div class="col-filter-bulk">
          <button type="button" class="btn-link btn-select-all">${i18n.t('select_all')}</button>
          <button type="button" class="btn-link btn-clear-selection">${i18n.t('clear_selection')}</button>
        </div>
        <div class="col-filter-list">
          ${hasEmpty ? `
            <label class="col-filter-item col-filter-empty" onclick="event.stopPropagation()">
              <input type="checkbox" value="${EMPTY_VAL}" ${emptyChecked ? 'checked' : ''}>
              <span style="color:var(--text-muted);font-style:italic">${emptyLabel}</span>
            </label>` : ''}
          ${uniqueVals.map(val => {
            const isChecked = isActive && filterStateObj[colKey].includes(val);
            return `
              <label class="col-filter-item" onclick="event.stopPropagation()">
                <input type="checkbox" value="${val}" ${isChecked ? 'checked' : ''}>
                <span title="${val}">${val}</span>
              </label>
            `;
          }).join('') || (!hasEmpty ? `<div style="padding:10px;text-align:center;color:var(--text-muted)">${i18n.t('no_records')}</div>` : '')}
        </div>
        <div class="col-filter-actions">
          <button class="btn btn-ghost btn-sm btn-reset">${i18n.t('reset')}</button>
          <button class="btn btn-primary btn-sm btn-apply">${i18n.t('apply')}</button>
        </div>
      `;

      // Search logic
      const searchInput = menu.querySelector('.col-filter-search input');
      searchInput.onkeyup = (e) => {
        const q = e.target.value.toLowerCase();
        menu.querySelectorAll('.col-filter-item').forEach(item => {
          const txt = item.querySelector('span').innerText.toLowerCase();
          item.style.display = txt.includes(q) ? 'flex' : 'none';
        });
      };

      // Select All / Clear Selection
      menu.querySelector('.btn-select-all').onclick = (e) => {
        e.stopPropagation();
        menu.querySelectorAll('.col-filter-item:not([style*="display: none"]) input[type="checkbox"]').forEach(cb => cb.checked = true);
      };

      menu.querySelector('.btn-clear-selection').onclick = (e) => {
        e.stopPropagation();
        menu.querySelectorAll('.col-filter-item:not([style*="display: none"]) input[type="checkbox"]').forEach(cb => cb.checked = false);
      };

      // Reset Filter
      menu.querySelector('.btn-reset').onclick = (e) => {
        e.stopPropagation();
        filterStateObj[colKey] = [];
        menu.classList.remove('open');
        onApply();
      };

      // Apply Filter
      menu.querySelector('.btn-apply').onclick = (e) => {
        e.stopPropagation();
        const checked = Array.from(menu.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        filterStateObj[colKey] = checked;
        menu.classList.remove('open');
        onApply();
      };
    });
    
    // Close menus on outside click - using a more robust way
    const closeOnOutside = () => {
       document.querySelectorAll('.col-filter-menu.open').forEach(m => m.classList.remove('open'));
    };
    document.removeEventListener('click', closeOnOutside);
    document.addEventListener('click', closeOnOutside);
  }

  // Filter local rows using the given state
  function filterRows(rows, filterStateObj, colDefs) {
    if (!filterStateObj) return rows;
    const EMPTY_VAL = '__EMPTY__';
    let filtered = rows;
    Object.keys(filterStateObj).forEach(colKey => {
      if (colKey === '_sort') return;
      const activeFilters = filterStateObj[colKey];
      if (activeFilters && activeFilters.length > 0 && colDefs[colKey]) {
        filtered = filtered.filter(row => {
          const val = colDefs[colKey].getVal(row);
          const isEmpty = val === '\u2014' || val === '' || val === null || val === undefined;
          if (activeFilters.includes(EMPTY_VAL) && isEmpty) return true;
          return activeFilters.filter(f => f !== EMPTY_VAL).includes(val);
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

  function openTransfer(id, currentType, label) {
    const types = {
      'm2m': i18n.t('nav_m2m'),
      'data': i18n.t('nav_data'),
      'voice': i18n.t('nav_voice')
    };
    
    let optionsHtml = Object.entries(types)
      .filter(([k]) => k !== currentType)
      .map(([k, v]) => `<option value="${k}">${v}</option>`)
      .join('');

    const content = `
      <div class="form-group">
        <label class="form-label">${i18n.t('key_toType')}</label>
        <select id="transferTargetType" class="form-control">
          ${optionsHtml}
        </select>
      </div>
    `;

    confirm(content, async () => {
      const targetType = document.getElementById('transferTargetType').value;
      try {
        await API.transferSim(id, currentType, targetType);
        
        // Close background modals if they are open
        closeModal('m2mModal');
        closeModal('dataModal');
        closeModal('voiceModal');

        // Refresh the current page
        if (typeof M2MPage !== 'undefined' && currentType === 'm2m') M2MPage.load();
        if (typeof DataPage !== 'undefined' && currentType === 'data') DataPage.load();
        if (typeof VoicePage !== 'undefined' && currentType === 'voice') VoicePage.load();
      } catch (err) { toast(err.message, 'error'); }
    }, { title: i18n.t('tooltip_transfer'), icon: '🔄', okText: i18n.t('confirm_ok'), okClass: 'btn-primary' });
  }

  return { toast, confirm, openModal, closeModal, statusBadge, operatorBadge, emptyState, loading, fillOperatorSelect, formData, setForm, sortRows, setupTableFilters, filterRows, initSelection, getSelectedIds, openTransfer };
})();
