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

  return { toast, confirm, openModal, closeModal, statusBadge, operatorBadge, emptyState, loading, fillOperatorSelect, formData, setForm };
})();
