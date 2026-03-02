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
  };

  // ─── Navigate ─────────────────────────────────────────────────────────────
  function navigate(page) {
    if (!pages[page]) page = 'm2m';

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    document.getElementById('topbarActions').innerHTML = '';
    pages[page].render();
    history.pushState({ page }, '', `#${page}`);
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
    const page = e.state?.page || 'm2m';
    navigate(page);
  });

  // ─── Initial page ─────────────────────────────────────────────────────────
  const hash = window.location.hash.replace('#', '');
  navigate(hash || 'm2m');
})();
