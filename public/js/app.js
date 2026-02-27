/* ─── MAIN APP ROUTER ─── */
(async () => {
  // Auth check
  const token = localStorage.getItem('simtrack_token');
  if (!token) { window.location.href = '/login.html'; return; }

  // Verify token
  try {
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('invalid');
    const user = await res.json();
    localStorage.setItem('simtrack_user', JSON.stringify(user));

    // Update sidebar user info
    document.getElementById('userAvatar').textContent = user.first_name.charAt(0).toUpperCase();
    document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('userRole').textContent = user.role === 'admin' ? 'Admin' : 'Kullanıcı';

    // Hide settings from non-admin (but still accessible if direct)
    // Show app
    document.getElementById('appLayout').style.display = 'flex';
  } catch {
    localStorage.clear();
    window.location.href = '/login.html';
    return;
  }

  // ─── Page Map ───
  const pages = {
    m2m:      { title: 'M2M Hatları',  render: () => M2MPage.render() },
    data:     { title: 'Data Hatları', render: () => DataPage.render() },
    voice:    { title: 'Ses Hatları',  render: () => VoicePage.render() },
    reports:  { title: 'Raporlar',     render: () => ReportsPage.render() },
    settings: { title: 'Ayarlar',      render: () => SettingsPage.render() },
  };

  // ─── Navigate ───
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

  // ─── Nav click events ───
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });

  // ─── Logout ───
  document.getElementById('logoutBtn').addEventListener('click', () => {
    UI.confirm('Çıkış yapmak istediğinize emin misiniz?', () => {
      localStorage.clear();
      window.location.href = '/login.html';
    }, { title: 'Çıkış Yap', icon: '👋', okText: 'Çıkış Yap', okClass: 'btn-secondary' });
  });

  // ─── Back/Forward ───
  window.addEventListener('popstate', (e) => {
    const page = e.state?.page || 'm2m';
    navigate(page);
  });

  // ─── Initial page ───
  const hash = window.location.hash.replace('#', '');
  navigate(hash || 'm2m');
})();
