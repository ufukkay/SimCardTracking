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
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Admin' : 'Kullanıcı';

    // Apply sidebar visibility based on permissions
    applySidebarPermissions(currentUser);

    document.getElementById('appLayout').style.display = 'flex';
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
    const moduleMap = { m2m: 'm2m', data: 'data', voice: 'voice' };
    Object.entries(moduleMap).forEach(([page, mod]) => {
      const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
      if (navItem && !canView(mod)) {
        navItem.style.opacity = '0.35';
        navItem.style.pointerEvents = 'none';
        navItem.title = 'Erişim yetkiniz yok';
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

  // ─── Page Map ─────────────────────────────────────────────────────────────
  const pages = {
    m2m:      { title: 'M2M Hatları',  render: () => canView('m2m')   ? M2MPage.render()     : renderAccessDenied('M2M Hatları') },
    data:     { title: 'Data Hatları', render: () => canView('data')  ? DataPage.render()    : renderAccessDenied('Data Hatları') },
    voice:    { title: 'Ses Hatları',  render: () => canView('voice') ? VoicePage.render()   : renderAccessDenied('Ses Hatları') },
    reports:  { title: 'Raporlar',     render: () => ReportsPage.render() },
    settings: { title: 'Ayarlar',      render: () => SettingsPage.render() },
    logs:     { title: 'İşlem Geçmişi', render: () => (currentUser.role === 'admin') ? LogsPage.render() : renderAccessDenied('İşlem Geçmişi') },
  };

  // ─── Navigate ─────────────────────────────────────────────────────────────
  let currentPage = null;
  function navigate(page, push = true) {
    if (!pages[page]) page = 'm2m';
    if (currentPage === page) return; // Don't re-render if already on this page
    currentPage = page;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    document.getElementById('topbarActions').innerHTML = '';
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
    UI.confirm('Çıkış yapmak istediğinize emin misiniz?', () => {
      localStorage.clear();
      window.location.href = '/login.html';
    }, { title: 'Çıkış Yap', icon: '👋', okText: 'Çıkış Yap', okClass: 'btn-secondary' });
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
  window.openTimeline = async (targetId, title = 'SIM Geçmişi') => {
    const container = document.getElementById('timelineContent');
    container.innerHTML = UI.loading();
    document.querySelector('#timelineModal .modal-title').textContent = title;
    UI.openModal('timelineModal');

    try {
      // Fetch logs for this specific targetId
      const logs = await API.getLogs(`?targetId=${targetId}&limit=50`);
      
      if (!logs || logs.length === 0) {
        container.innerHTML = UI.emptyState('⏳', 'Henüz geçmiş kaydı bulunmuyor.', 'Bu kart üzerindeki işlemler burada listelenecektir.');
        return;
      }

      const actionTranslations = {
        'CREATE': 'Kart Oluşturuldu',
        'UPDATE': 'Kart Güncellendi',
        'DELETE': 'Kart Silindi',
        'BULK_UPDATE': 'Toplu Güncelleme Uygulandı'
      };

      const keyTranslations = {
        'iccid': 'ICCID',
        'phone_no': 'Telefon No',
        'plate_no': 'Plaka',
        'operator': 'Operatör',
        'vehicle_type': 'Araç Tipi',
        'status': 'Durum',
        'package_id': 'Paket ID',
        'assigned_to': 'Personel',
        'location': 'Lokasyon'
      };

      container.innerHTML = logs.map(log => {
        const date = new Date(log.created_at).toLocaleString('tr-TR');
        let detailsHtml = '';
        
        try {
          if (log.details && log.details.startsWith('{')) {
            const d = JSON.parse(log.details);
            detailsHtml = Object.entries(d).map(([k, v]) => {
              const label = keyTranslations[k] || k;
              let val = v;
              if (k === 'status') {
                const statusMap = { 'active': 'Aktif', 'passive': 'Pasif', 'spare': 'Yedek' };
                val = statusMap[v] || v;
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

  // ─── Initial page ─────────────────────────────────────────────────────────
  const hash = window.location.hash.replace('#', '');
  navigate(hash || 'm2m', false);
})();
