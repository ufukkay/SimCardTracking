/* ─── MAIN APP ROUTER ─── */
(async () => {
  // Auth check
  const token = localStorage.getItem('simtrack_token');
  if (!token) { window.location.href = '/login.html'; return; }

  // Verify token → get user + permissions from server
  let currentUser;
  try {
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('invalid');
    currentUser = await res.json();
    localStorage.setItem('simtrack_user', JSON.stringify(currentUser));

    // Update sidebar user info
    document.getElementById('userAvatar').textContent = currentUser.first_name.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? i18n.t('role_admin') : (currentUser.role === 'editor' ? i18n.t('role_editor') : i18n.t('role_viewer'));

    // Apply sidebar visibility based on permissions
    applySidebarPermissions(currentUser);

    const appLayout = document.getElementById('appLayout');
    appLayout.classList.remove('app-layout-hidden');
    appLayout.style.display = 'flex';
    i18n.updateUI(); // Dil desteğini uygula
  } catch {
    localStorage.clear();
    window.location.href = '/login.html';
    return;
  }

  // ─── Permission Helpers ───────────────────────────────────────────────────
  function canView(module) {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.[module]?.view === true;
  }
  function canEdit(module) {
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions?.[module]?.edit === true;
  }

  // Expose globally so page modules (m2m.js, data.js, voice.js) can check edit access
  window.AppPerms = { canView, canEdit };

  function applySidebarPermissions(user) {
    if (user.role === 'admin') return; // admin sees everything
    const moduleMap = { m2m: 'm2m', data: 'data', voice: 'voice', invoices: 'invoices' };
    Object.entries(moduleMap).forEach(([page, mod]) => {
      const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
      if (navItem && !canView(mod)) {
        navItem.style.opacity = '0.35';
        navItem.style.pointerEvents = 'none';
        navItem.title = i18n.t('no_permission');
      }
    });
  }

  // ─── Access Denied page ───────────────────────────────────────────────────
  function renderAccessDenied(module) {
    document.getElementById('pageTitle').textContent = 'Erişim Reddedildi';
    document.getElementById('topbarActions').innerHTML = '';
    document.getElementById('pageContent').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;text-align:center">
        <div style="font-size:56px">🔒</div>
        <h2 style="font-size:20px;font-weight:700;color:var(--text-main)">Erişim Yetkiniz Yok</h2>
        <p style="color:var(--text-muted);font-size:14px;max-width:380px">
          <strong>${module}</strong> modülünü görüntüleme yetkiniz bulunmuyor.<br>
          Yetkinizi genişletmek için yöneticiyle iletişime geçin.
        </p>
      </div>`;
  }

  const pages = {
    m2m:      { title: 'nav_m2m',  render: () => canView('m2m')   ? M2MPage.render()     : renderAccessDenied('nav_m2m') },
    data:     { title: 'nav_data', render: () => canView('data')  ? DataPage.render()    : renderAccessDenied('nav_data') },
    voice:    { title: 'nav_voice', render: () => canView('voice') ? VoicePage.render()   : renderAccessDenied('nav_voice') },
    invoices: { title: 'nav_invoices', render: () => canView('invoices') ? InvoicesPage.render() : renderAccessDenied('nav_invoices') },
    reports:  { title: 'nav_reports',     render: () => ReportsPage.render() },
    settings: { title: 'nav_settings',      render: () => SettingsPage.render() },
    logs:     { title: 'nav_logs', render: () => (currentUser.role === 'admin') ? LogsPage.render() : renderAccessDenied('nav_logs') },
  };

  // ─── Global State ─────────────────────────────────────────────────────────
  window.App = {
    currentPage: null
  };

  // ─── Navigate ─────────────────────────────────────────────────────────────
  function navigate(page, push = true) {
    if (!pages[page]) page = 'm2m';
    if (window.App.currentPage === page) return; // Don't re-render if already on this page
    window.App.currentPage = page;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    document.getElementById('topbarActions').innerHTML = '';
    window.currentPageTitleKey = pages[page].title;
    document.getElementById('pageTitle').textContent = i18n.t(pages[page].title);

    pages[page].render();
    if (push) history.pushState({ page }, '', `#${page}`);
  }

  // ─── Nav click events ─────────────────────────────────────────────────────
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────
  document.getElementById('logoutBtn').addEventListener('click', () => {
    UI.confirm(i18n.t('confirm_logout') || 'Çıkış yapmak istediğinize emin misiniz?', () => {
      localStorage.clear();
      window.location.href = '/login.html';
    }, { title: i18n.t('logout'), icon: '👋', okText: i18n.t('logout'), okClass: 'btn-secondary' });
  });

  // ─── Back/Forward ─────────────────────────────────────────────────────────
  window.addEventListener('popstate', (e) => {
    const page = e.state?.page || window.location.hash.replace('#', '') || 'm2m';
    navigate(page, false); // Don't pushState again
  });

  // ─── Theme Toggle ────────────────────────────────────────────────────────
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const body = document.body;

  function setTheme(isDark) {
    body.classList.toggle('dark-theme', isDark);
    localStorage.setItem('simtrack_theme', isDark ? 'dark' : 'light');
    themeIcon.innerHTML = isDark 
      ? '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = !body.classList.contains('dark-theme');
    setTheme(isDark);
  });

  // Load saved theme
  const savedTheme = localStorage.getItem('simtrack_theme');
  if (savedTheme === 'dark') setTheme(true);

  // ─── Timeline Global Function ─────────────────────────────────────────────
  window.openTimeline = async (targetId, titleKey = 'timeline_title') => {
    const container = document.getElementById('timelineContent');
    container.innerHTML = UI.loading();
    document.querySelector('#timelineModal .modal-title').textContent = i18n.t(titleKey);
    UI.openModal('timelineModal');

    try {
      // Fetch logs for this specific targetId
      const logs = await API.getLogs(`?targetId=${targetId}&limit=50`);
      
      if (!logs || logs.length === 0) {
        container.innerHTML = UI.emptyState('⏳', 'Henüz geçmiş kaydı bulunmuyor.', 'Bu kart üzerindeki işlemler burada listelenecektir.');
        return;
      }

      const actionTranslations = {
        'CREATE': i18n.t('action_CREATE'),
        'UPDATE': i18n.t('action_UPDATE'),
        'DELETE': i18n.t('action_DELETE'),
        'BULK_UPDATE': i18n.t('action_BULK_UPDATE'),
        'TRANSFER': i18n.t('action_TRANSFER')
      };

      const keyTranslations = {
        'iccid': i18n.t('key_iccid'),
        'phone_no': i18n.t('key_phone_no'),
        'plate_no': i18n.t('key_plate_no'),
        'operator': i18n.t('key_operator'),
        'vehicle_type': i18n.t('key_vehicle_type'),
        'status': i18n.t('key_status'),
        'package_id': i18n.t('key_package_id'),
        'assigned_to': i18n.t('key_assigned_to'),
        'location': i18n.t('key_location'),
        'fromType': i18n.t('key_fromType'),
        'toType': i18n.t('key_toType')
      };

      container.innerHTML = logs.map(log => {
        // Robust date parsing (handle 'YYYY-MM-DD HH:mm:ss' which might fail in some browsers)
        let dateStr = log.created_at;
        if (dateStr && !dateStr.includes('T') && dateStr.includes(' ')) {
          dateStr = dateStr.replace(' ', 'T');
        }
        const date = new Date(dateStr).toLocaleString('tr-TR');
        let detailsHtml = '';
        
        try {
          if (log.details && log.details.startsWith('{')) {
            const d = JSON.parse(log.details);
            detailsHtml = Object.entries(d).map(([k, v]) => {
              const label = keyTranslations[k] || k;
              let val = v;
              if (k === 'status') {
                val = i18n.t('status_' + v) || v;
              }
              return `• ${label}: ${val}`;
            }).join('<br>');
          } else {
            detailsHtml = log.details || '-';
          }
        } catch(e) { detailsHtml = log.details || '-'; }

        return `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <span class="timeline-date">${date}</span>
            <div class="timeline-card">
              <div class="timeline-title">${actionTranslations[log.action] || log.action}</div>
              <div class="timeline-details">${detailsHtml}</div>
              <div class="timeline-user">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                ${log.username}
              </div>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger);padding:20px;text-align:center">${err.message}</p>`;
    }
  };

  // ─── Global Input Cleanups ────────────────────────────────────────────────
  document.addEventListener('input', (e) => {
    const isSearch = e.target.classList.contains('search-input');
    const isPhone  = e.target.name === 'phone_no' || e.target.getAttribute('data-key') === 'phone_no';

    if (isSearch || isPhone) {
      const val = e.target.value;
      // Eğer giriş sayı ile başlıyorsa (Telefon No/ICCID araması), tüm boşlukları sil
      if (/^\d/.test(val)) {
        e.target.value = val.replace(/\s/g, '');
      }
    }
  });

  // ─── Initial page ─────────────────────────────────────────────────────────
  const hash = window.location.hash.replace('#', '');
  navigate(hash || 'm2m', false);
})();
