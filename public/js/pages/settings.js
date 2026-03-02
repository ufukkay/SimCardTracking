/* ─── AYARLAR SAYFASI (FULL REWRITE) ─── */
const SettingsPage = (() => {
  let editingUserId = null;
  let editingVehicleId = null;
  let editingLocationId = null;
  let editingPersonnelId = null;

  /* ════════════ RENDER ════════════ */
  function render() {
    document.getElementById('pageTitle').textContent = 'Ayarlar';
    document.getElementById('pageContent').innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" onclick="SettingsPage.switchTab('users',this)">👥 Kullanıcılar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('vehicles',this)">🚗 Araçlar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('locations',this)">📍 Lokasyonlar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('personnelTab',this)">👤 Personeller</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('operators',this)">📡 Operatörler</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('importM2M',this)">📥 M2M Aktar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('importData',this)">📥 Data Aktar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('importSes',this)">📥 Ses Aktar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('profile',this)">🔐 Şifre Değiştir</button>
        <button class="tab-btn" id="updateTabBtn" onclick="SettingsPage.switchTab('update',this)" style="display:none">🔄 Güncelleme</button>
      </div>

      <!-- KULLANICILAR -->
      <div class="tab-pane active" id="tab-users">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Kullanıcı Yönetimi</span>
            <button class="btn btn-primary" id="addUserBtn" onclick="SettingsPage.openAddUser()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Yeni Kullanıcı
            </button>
          </div>
          <div class="table-container">
            <table><thead><tr><th>#</th><th>Ad Soyad</th><th>Kullanıcı Adı</th><th>Şirket</th><th>E-posta</th><th>Tel</th><th>Rol</th><th>İşlem</th></tr></thead>
              <tbody id="usersTableBody"></tbody></table>
          </div>
        </div>
      </div>

      <!-- ARAÇLAR -->
      <div class="tab-pane" id="tab-vehicles">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Araç / Plaka Yönetimi</span>
            <button class="btn btn-primary" onclick="SettingsPage.openAddVehicle()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Yeni Araç
            </button>
          </div>
          <div class="table-container">
            <table><thead><tr><th>#</th><th>Plaka</th><th>Araç Tipi</th><th>Notlar</th><th>İşlem</th></tr></thead>
              <tbody id="vehiclesTableBody"></tbody></table>
          </div>
        </div>
      </div>

      <!-- LOKASYONLAR -->
      <div class="tab-pane" id="tab-locations">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Lokasyon Yönetimi</span>
            <button class="btn btn-primary" onclick="SettingsPage.openAddLocation()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Yeni Lokasyon
            </button>
          </div>
          <div class="table-container">
            <table><thead><tr><th>#</th><th>Lokasyon Adı</th><th>Adres</th><th>Notlar</th><th>İşlem</th></tr></thead>
              <tbody id="locationsTableBody"></tbody></table>
          </div>
        </div>
      </div>

      <!-- PERSONELLER -->
      <div class="tab-pane" id="tab-personnelTab">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Personel Yönetimi</span>
            <button class="btn btn-primary" onclick="SettingsPage.openAddPersonnel()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Yeni Personel
            </button>
          </div>
          <div class="table-container">
            <table><thead><tr><th>#</th><th>Ad Soyad</th><th>Departman</th><th>Şirket</th><th>Telefon</th><th>Notlar</th><th>İşlem</th></tr></thead>
              <tbody id="personnelTableBody"></tbody></table>
          </div>
        </div>
      </div>

      <!-- OPERATÖRLER -->
      <div class="tab-pane" id="tab-operators">
        <div class="card">
          <div class="card-header"><span class="card-title">Operatör Yönetimi</span></div>
          <div style="display:flex;gap:10px;margin-bottom:16px">
            <input type="text" id="newOperatorName" class="form-control" placeholder="Yeni operatör adı..." style="max-width:260px">
            <button class="btn btn-primary" onclick="SettingsPage.addOperator()">Ekle</button>
          </div>
          <div id="operatorList"></div>
        </div>
      </div>

      <!-- M2M AKTAR -->
      <div class="tab-pane" id="tab-importM2M">
        <div class="card">
          <div class="card-header"><span class="card-title">📥 M2M Hatları — Toplu İçeri Aktar</span></div>
          <div id="import-container-m2m"><div class="loading-overlay"><div class="spinner"></div></div></div>
        </div>
      </div>

      <!-- DATA AKTAR -->
      <div class="tab-pane" id="tab-importData">
        <div class="card">
          <div class="card-header"><span class="card-title">📥 Data Hatları — Toplu İçeri Aktar</span></div>
          <div id="import-container-data"><div class="loading-overlay"><div class="spinner"></div></div></div>
        </div>
      </div>

      <!-- SES AKTAR -->
      <div class="tab-pane" id="tab-importSes">
        <div class="card">
          <div class="card-header"><span class="card-title">📥 Ses Hatları — Toplu İçeri Aktar</span></div>
          <div id="import-container-voice"><div class="loading-overlay"><div class="spinner"></div></div></div>
        </div>
      </div>

      <!-- GÜNCELLEME (admin only) -->
      <div class="tab-pane" id="tab-update">
        <div class="card" style="max-width:560px">
          <div class="card-header"><span class="card-title">🔄 Uygulama Güncellemesi</span></div>
          <div style="padding:6px 0 20px;display:flex;flex-direction:column;gap:18px">
            <div id="updateStatusBox" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px 18px;font-size:13px">
              <div style="color:var(--text-muted)">GitHub bağlantısı kontrol ediliyor...</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-secondary" id="checkUpdateBtn" onclick="SettingsPage.checkUpdate()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.26"/></svg>
                Güncelleme Kontrol Et
              </button>
              <button class="btn btn-primary" id="applyUpdateBtn" onclick="SettingsPage.applyUpdate()" style="display:none">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                Güncellemeyi Uygula
              </button>
            </div>
            <div style="font-size:11px;color:var(--text-muted);line-height:1.6">
              ℹ️ Güncelleme uygulandığında uygulama otomatik olarak yeniden başlatılır.<br>
              Veritabanı dosyaları <strong>korunur</strong> — hiçbir veri kaybolmaz.
            </div>
          </div>
        </div>
      </div>

      <div class="tab-pane" id="tab-profile">
        <div class="card" style="max-width:460px">
          <div class="card-header"><span class="card-title">Şifre Değiştir</span></div>
          <form id="pwdForm" onsubmit="SettingsPage.changePassword(event)" style="padding:4px 0 14px;display:flex;flex-direction:column;gap:13px">
            <div class="form-group"><label class="form-label">Mevcut Şifre</label><input type="password" id="oldPwd" class="form-control" required></div>
            <div class="form-group"><label class="form-label">Yeni Şifre</label><input type="password" id="newPwd" class="form-control" required minlength="6"></div>
            <div class="form-group"><label class="form-label">Yeni Şifre (Tekrar)</label><input type="password" id="newPwd2" class="form-control" required></div>
            <div><button type="submit" class="btn btn-primary">Şifreyi Güncelle</button></div>
          </form>
        </div>
      </div>

      <!-- ── MODALS ── -->

      <!-- Kullanıcı -->
      <div class="modal-overlay" id="userModal">
        <div class="modal" style="max-width:560px">
          <div class="modal-header"><span class="modal-title" id="userModalTitle">Yeni Kullanıcı</span><button class="modal-close" onclick="UI.closeModal('userModal')">×</button></div>
          <form class="modal-body" id="userForm" onsubmit="SettingsPage.saveUser(event)">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Ad *</label><input name="first_name" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Soyad *</label><input name="last_name" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Kullanıcı Adı *</label><input name="username" id="usernameField" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Şirket</label><input name="company" class="form-control"></div>
              <div class="form-group"><label class="form-label">E-posta</label><input name="email" type="email" class="form-control"></div>
              <div class="form-group"><label class="form-label">Telefon</label><input name="phone" class="form-control"></div>
              <div class="form-group">
                <label class="form-label">Rol</label>
                <select name="role" id="userRoleSelect" class="form-control" onchange="SettingsPage.onRoleChange(this.value)">
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="form-group" id="passwordField"><label class="form-label">Şifre *</label><input name="password" type="password" id="userPwdInput" class="form-control" minlength="6" placeholder="Boş = değişmez"></div>
            </div>

            <!-- ─── Modül Yetkileri ─── -->
            <div id="permissionsPanel" style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px">
              <div style="font-weight:600;font-size:13px;margin-bottom:10px;color:var(--text-main)">🔐 Modül Yetkileri</div>
              <table style="width:100%;font-size:13px;border-collapse:collapse">
                <thead>
                  <tr>
                    <th style="text-align:left;padding:6px 4px;color:var(--text-muted);font-weight:500">Modül</th>
                    <th style="text-align:center;padding:6px 8px;color:var(--text-muted);font-weight:500">👁 Görüntüle</th>
                    <th style="text-align:center;padding:6px 8px;color:var(--text-muted);font-weight:500">✏️ Düzenle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="border-top:1px solid var(--border)">
                    <td style="padding:8px 4px">🚗 M2M Hatları</td>
                    <td style="text-align:center"><input type="checkbox" id="perm_m2m_view" onchange="SettingsPage.onPermViewChange('m2m',this)"></td>
                    <td style="text-align:center"><input type="checkbox" id="perm_m2m_edit" onchange="SettingsPage.onPermEditChange('m2m',this)"></td>
                  </tr>
                  <tr style="border-top:1px solid var(--border)">
                    <td style="padding:8px 4px">🌐 Data Hatları</td>
                    <td style="text-align:center"><input type="checkbox" id="perm_data_view" onchange="SettingsPage.onPermViewChange('data',this)"></td>
                    <td style="text-align:center"><input type="checkbox" id="perm_data_edit" onchange="SettingsPage.onPermEditChange('data',this)"></td>
                  </tr>
                  <tr style="border-top:1px solid var(--border)">
                    <td style="padding:8px 4px">📞 Ses Hatları</td>
                    <td style="text-align:center"><input type="checkbox" id="perm_voice_view" onchange="SettingsPage.onPermViewChange('voice',this)"></td>
                    <td style="text-align:center"><input type="checkbox" id="perm_voice_edit" onchange="SettingsPage.onPermEditChange('voice',this)"></td>
                  </tr>
                </tbody>
              </table>
              <div style="font-size:11px;color:var(--text-muted);margin-top:8px">ℹ️ Admin kullanıcılar tüm modüllere tam erişime sahiptir.</div>
            </div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('userModal')">İptal</button><button class="btn btn-primary" id="userSaveBtn" onclick="document.getElementById('userForm').requestSubmit()">Kaydet</button></div>
        </div>
      </div>

      <!-- Araç -->
      <div class="modal-overlay" id="vehicleModal">
        <div class="modal" style="max-width:420px">
          <div class="modal-header"><span class="modal-title" id="vehicleModalTitle">Yeni Araç</span><button class="modal-close" onclick="UI.closeModal('vehicleModal')">×</button></div>
          <form class="modal-body" id="vehicleForm" onsubmit="SettingsPage.saveVehicle(event)">
            <div class="form-group"><label class="form-label">Plaka *</label><input name="plate_no" class="form-control" placeholder="34 ABC 001" required></div>
            <div class="form-group"><label class="form-label">Araç Tipi</label><input name="vehicle_type" class="form-control" placeholder="Binek, Kamyon, Minibüs..."></div>
            <div class="form-group"><label class="form-label">Notlar</label><textarea name="notes" class="form-control"></textarea></div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('vehicleModal')">İptal</button><button class="btn btn-primary" id="vehicleSaveBtn" onclick="document.getElementById('vehicleForm').requestSubmit()">Kaydet</button></div>
        </div>
      </div>

      <!-- Lokasyon -->
      <div class="modal-overlay" id="locationModal">
        <div class="modal" style="max-width:420px">
          <div class="modal-header"><span class="modal-title" id="locationModalTitle">Yeni Lokasyon</span><button class="modal-close" onclick="UI.closeModal('locationModal')">×</button></div>
          <form class="modal-body" id="locationForm" onsubmit="SettingsPage.saveLocation(event)">
            <div class="form-group"><label class="form-label">Lokasyon Adı *</label><input name="name" class="form-control" placeholder="A Ofisi, İstanbul Depo..." required></div>
            <div class="form-group"><label class="form-label">Adres</label><input name="address" class="form-control" placeholder="Tam adres..."></div>
            <div class="form-group"><label class="form-label">Notlar</label><textarea name="notes" class="form-control"></textarea></div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('locationModal')">İptal</button><button class="btn btn-primary" id="locationSaveBtn" onclick="document.getElementById('locationForm').requestSubmit()">Kaydet</button></div>
        </div>
      </div>

      <!-- Personel -->
      <div class="modal-overlay" id="personnelModal">
        <div class="modal">
          <div class="modal-header"><span class="modal-title" id="personnelModalTitle">Yeni Personel</span><button class="modal-close" onclick="UI.closeModal('personnelModal')">×</button></div>
          <form class="modal-body" id="personnelForm" onsubmit="SettingsPage.savePersonnel(event)">
            <div class="form-grid">
              <div class="form-group"><label class="form-label">Ad *</label><input name="first_name" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Soyad *</label><input name="last_name" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Departman</label><input name="department" class="form-control" placeholder="IT, Muhasebe..."></div>
              <div class="form-group"><label class="form-label">Şirket</label><input name="company" class="form-control"></div>
              <div class="form-group"><label class="form-label">Telefon</label><input name="phone" class="form-control"></div>
              <div class="form-group col-span-2"><label class="form-label">Notlar</label><textarea name="notes" class="form-control"></textarea></div>
            </div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('personnelModal')">İptal</button><button class="btn btn-primary" id="personnelSaveBtn" onclick="document.getElementById('personnelForm').requestSubmit()">Kaydet</button></div>
        </div>
      </div>
    `;

    loadUsers();
    loadVehicles();
    loadLocations();
    loadPersonnel();
    loadOperators();
    
    // Show update tab for admins
    const currentUser = JSON.parse(localStorage.getItem('simtrack_user') || '{}');
    if (currentUser.role === 'admin') {
      const btn = document.getElementById('updateTabBtn');
      if (btn) btn.style.display = 'inline-block';
    }
  }

  function switchTab(tab, btn) {
    document.querySelectorAll('#pageContent .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#pageContent .tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
    // Lazy-render import tabs
    if (tab === 'importM2M' && document.getElementById('import-container-m2m')?.querySelector('.spinner')) {
      BulkImport.renderTab('m2m', 'import-container-m2m', null);
    }
    if (tab === 'importData' && document.getElementById('import-container-data')?.querySelector('.spinner')) {
      BulkImport.renderTab('data', 'import-container-data', null);
    }
    if (tab === 'importSes' && document.getElementById('import-container-voice')?.querySelector('.spinner')) {
      BulkImport.renderTab('voice', 'import-container-voice', null);
    }
    if (tab === 'update') {
      SettingsPage.checkUpdate();
    }
  }

  /* ════════════ USERS ════════════ */
  async function loadUsers() {
    const currentUser = JSON.parse(localStorage.getItem('simtrack_user') || '{}');
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if (currentUser.role !== 'admin') {
      tbody.innerHTML = `<tr><td colspan="8" class="td-muted" style="padding:20px">Yalnızca admin görebilir.</td></tr>`;
      const btn = document.getElementById('addUserBtn'); if (btn) btn.style.display = 'none';
      return;
    }
    try {
      const users = await API.getUsers();
      tbody.innerHTML = users.map((u, i) => `
        <tr>
          <td class="td-muted">${i + 1}</td>
          <td><strong>${u.first_name} ${u.last_name}</strong></td>
          <td class="td-muted">${u.username}</td>
          <td class="td-muted">${u.company || '—'}</td>
          <td class="td-muted">${u.email || '—'}</td>
          <td class="td-muted">${u.phone || '—'}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-info' : 'badge-muted'}">${u.role === 'admin' ? 'Admin' : 'Kullanıcı'}</span></td>
          <td><div class="action-buttons">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="SettingsPage.openEditUser(${u.id})" title="Düzenle">${editIcon()}</button>
            ${currentUser.id !== u.id ? `<button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deleteUser(${u.id},'${u.first_name} ${u.last_name}')" title="Sil">${delIcon()}</button>` : '<span class="td-muted" style="font-size:11px;padding:4px">Siz</span>'}
          </div></td>
        </tr>`).join('');
    } catch (err) { if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);padding:16px">${err.message}</td></tr>`; }
  }

  function openAddUser() {
    editingUserId = null;
    document.getElementById('userModalTitle').textContent = 'Yeni Kullanıcı';
    document.getElementById('userForm').reset();
    document.getElementById('usernameField').readOnly = false;
    document.getElementById('userPwdInput').required = true;
    document.getElementById('userRoleSelect').value = 'user';
    onRoleChange('user');
    setPermCheckboxes(null);
    UI.openModal('userModal');
  }
  async function openEditUser(id) {
    editingUserId = id;
    document.getElementById('userModalTitle').textContent = 'Kullanıcıyı Düzenle';
    try {
      const users = await API.getUsers();
      const u = users.find(u => u.id === id) || {};
      const savedPermissions = u.permissions; // save before stripping

      // Strip permissions from setForm payload (it's an object, not a form field)
      const { permissions: _p, ...formData } = u;
      UI.setForm('userForm', formData);

      document.getElementById('usernameField').readOnly = true;
      document.getElementById('userPwdInput').required = false;

      // Open modal first so DOM elements exist
      UI.openModal('userModal');

      // Then set role & permissions (after modal is visible/rendered)
      const role = u.role || 'user';
      document.getElementById('userRoleSelect').value = role;
      onRoleChange(role);
      setPermCheckboxes(savedPermissions);
    } catch (err) { UI.toast(err.message, 'error'); }
  }
  async function saveUser(e) {
    e.preventDefault(); const btn = document.getElementById('userSaveBtn'); btn.disabled = true;
    const data = UI.formData('userForm');
    if (!data.password) delete data.password;
    // Collect permissions from checkboxes (only for non-admin users)
    if (data.role !== 'admin') {
      data.permissions = {
        m2m:   { view: document.getElementById('perm_m2m_view')?.checked || false,   edit: document.getElementById('perm_m2m_edit')?.checked || false },
        data:  { view: document.getElementById('perm_data_view')?.checked || false,  edit: document.getElementById('perm_data_edit')?.checked || false },
        voice: { view: document.getElementById('perm_voice_view')?.checked || false, edit: document.getElementById('perm_voice_edit')?.checked || false },
      };
    } else {
      data.permissions = null;
    }
    try {
      if (editingUserId) { await API.updateUser(editingUserId, data); UI.toast('Kullanıcı güncellendi.', 'success'); }
      else { await API.addUser(data); UI.toast('Kullanıcı oluşturuldu.', 'success'); }
      UI.closeModal('userModal'); loadUsers();
    } catch (err) { UI.toast(err.message, 'error'); }
    finally { btn.disabled = false; }
  }

  /* ─ Permission helpers ─ */
  function onRoleChange(role) {
    const panel = document.getElementById('permissionsPanel');
    if (panel) panel.style.display = role === 'admin' ? 'none' : 'block';
  }
  function setPermCheckboxes(perms) {
    ['m2m', 'data', 'voice'].forEach(mod => {
      const v = document.getElementById(`perm_${mod}_view`);
      const e = document.getElementById(`perm_${mod}_edit`);
      if (v) v.checked = perms?.[mod]?.view || false;
      if (e) e.checked = perms?.[mod]?.edit || false;
    });
  }
  function onPermViewChange(mod, cb) {
    // If unchecking view → also uncheck edit
    if (!cb.checked) {
      const editCb = document.getElementById(`perm_${mod}_edit`);
      if (editCb) editCb.checked = false;
    }
  }
  function onPermEditChange(mod, cb) {
    // If checking edit → also check view
    if (cb.checked) {
      const viewCb = document.getElementById(`perm_${mod}_view`);
      if (viewCb) viewCb.checked = true;
    }
  }
  function deleteUser(id, name) {
    UI.confirm(`"${name}" silinecek.`, async () => { try { await API.deleteUser(id); UI.toast('Silindi.','success'); loadUsers(); } catch(e){UI.toast(e.message,'error');} });
  }

  /* ════════════ VEHICLES ════════════ */
  async function loadVehicles() {
    const tbody = document.getElementById('vehiclesTableBody'); if (!tbody) return;
    try {
      const rows = await API.getVehicles();
      tbody.innerHTML = rows.length ? rows.map((r,i) => `
        <tr>
          <td class="td-muted">${i+1}</td>
          <td><strong>${r.plate_no}</strong></td>
          <td class="td-muted">${r.vehicle_type || '—'}</td>
          <td class="td-muted">${r.notes || '—'}</td>
          <td><div class="action-buttons">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="SettingsPage.openEditVehicle(${r.id})" title="Düzenle">${editIcon()}</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deleteVehicle(${r.id},'${r.plate_no}')" title="Sil">${delIcon()}</button>
          </div></td>
        </tr>`).join('') : `<tr><td colspan="5">${UI.emptyState('🚗','Araç kaydı yok','Yeni araç ekleyerek başlayın.')}</td></tr>`;
    } catch (err) { if (tbody) tbody.innerHTML=`<tr><td colspan="5" style="color:var(--danger);padding:16px">${err.message}</td></tr>`; }
  }

  function openAddVehicle() { editingVehicleId=null; document.getElementById('vehicleModalTitle').textContent='Yeni Araç'; document.getElementById('vehicleForm').reset(); UI.openModal('vehicleModal'); }
  async function openEditVehicle(id) {
    editingVehicleId=id; document.getElementById('vehicleModalTitle').textContent='Aracı Düzenle';
    try { UI.setForm('vehicleForm', await API.get(`/vehicles/${id}`)); UI.openModal('vehicleModal'); } catch(e){UI.toast(e.message,'error');}
  }
  async function saveVehicle(e) {
    e.preventDefault(); const btn=document.getElementById('vehicleSaveBtn'); btn.disabled=true;
    try {
      const d = UI.formData('vehicleForm');
      if (editingVehicleId) { await API.updateVehicle(editingVehicleId,d); UI.toast('Araç güncellendi.','success'); }
      else { await API.addVehicle(d); UI.toast('Araç eklendi.','success'); }
      UI.closeModal('vehicleModal'); loadVehicles();
    } catch(e){UI.toast(e.message,'error');} finally{btn.disabled=false;}
  }
  function deleteVehicle(id, plate) {
    UI.confirm(`"${plate}" silinecek.`, async()=>{ try{await API.deleteVehicle(id); UI.toast('Silindi.','success'); loadVehicles();}catch(e){UI.toast(e.message,'error');} });
  }

  /* ════════════ LOCATIONS ════════════ */
  async function loadLocations() {
    const tbody = document.getElementById('locationsTableBody'); if (!tbody) return;
    try {
      const rows = await API.getLocations();
      tbody.innerHTML = rows.length ? rows.map((r,i) => `
        <tr>
          <td class="td-muted">${i+1}</td>
          <td><strong>${r.name}</strong></td>
          <td class="td-muted">${r.address || '—'}</td>
          <td class="td-muted">${r.notes || '—'}</td>
          <td><div class="action-buttons">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="SettingsPage.openEditLocation(${r.id})" title="Düzenle">${editIcon()}</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deleteLocation(${r.id},'${r.name}')" title="Sil">${delIcon()}</button>
          </div></td>
        </tr>`).join('') : `<tr><td colspan="5">${UI.emptyState('📍','Lokasyon kaydı yok','Yeni lokasyon ekleyerek başlayın.')}</td></tr>`;
    } catch(err){if(tbody)tbody.innerHTML=`<tr><td colspan="5" style="color:var(--danger);padding:16px">${err.message}</td></tr>`;}
  }

  function openAddLocation() { editingLocationId=null; document.getElementById('locationModalTitle').textContent='Yeni Lokasyon'; document.getElementById('locationForm').reset(); UI.openModal('locationModal'); }
  async function openEditLocation(id) {
    editingLocationId=id; document.getElementById('locationModalTitle').textContent='Lokasyonu Düzenle';
    try { UI.setForm('locationForm', await API.get(`/locations/${id}`)); UI.openModal('locationModal'); } catch(e){UI.toast(e.message,'error');}
  }
  async function saveLocation(e) {
    e.preventDefault(); const btn=document.getElementById('locationSaveBtn'); btn.disabled=true;
    try {
      const d=UI.formData('locationForm');
      if(editingLocationId){await API.updateLocation(editingLocationId,d); UI.toast('Lokasyon güncellendi.','success');}
      else{await API.addLocation(d); UI.toast('Lokasyon eklendi.','success');}
      UI.closeModal('locationModal'); loadLocations();
    }catch(e){UI.toast(e.message,'error');}finally{btn.disabled=false;}
  }
  function deleteLocation(id, name) {
    UI.confirm(`"${name}" silinecek.`, async()=>{ try{await API.deleteLocation(id); UI.toast('Silindi.','success'); loadLocations();}catch(e){UI.toast(e.message,'error');} });
  }

  /* ════════════ PERSONNEL ════════════ */
  async function loadPersonnel() {
    const tbody = document.getElementById('personnelTableBody'); if (!tbody) return;
    try {
      const rows = await API.getPersonnel();
      tbody.innerHTML = rows.length ? rows.map((r,i) => `
        <tr>
          <td class="td-muted">${i+1}</td>
          <td><strong>${r.first_name} ${r.last_name}</strong></td>
          <td class="td-muted">${r.department || '—'}</td>
          <td class="td-muted">${r.company || '—'}</td>
          <td class="td-muted">${r.phone || '—'}</td>
          <td class="td-muted">${r.notes || '—'}</td>
          <td><div class="action-buttons">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="SettingsPage.openEditPersonnel(${r.id})" title="Düzenle">${editIcon()}</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deletePersonnel(${r.id},'${r.first_name} ${r.last_name}')" title="Sil">${delIcon()}</button>
          </div></td>
        </tr>`).join('') : `<tr><td colspan="7">${UI.emptyState('👤','Personel kaydı yok','Yeni personel ekleyerek başlayın.')}</td></tr>`;
    } catch(err){if(tbody)tbody.innerHTML=`<tr><td colspan="7" style="color:var(--danger);padding:16px">${err.message}</td></tr>`;}
  }

  function openAddPersonnel() { editingPersonnelId=null; document.getElementById('personnelModalTitle').textContent='Yeni Personel'; document.getElementById('personnelForm').reset(); UI.openModal('personnelModal'); }
  async function openEditPersonnel(id) {
    editingPersonnelId=id; document.getElementById('personnelModalTitle').textContent='Personeli Düzenle';
    try { UI.setForm('personnelForm', await API.get(`/personnel/${id}`)); UI.openModal('personnelModal'); } catch(e){UI.toast(e.message,'error');}
  }
  async function savePersonnel(e) {
    e.preventDefault(); const btn=document.getElementById('personnelSaveBtn'); btn.disabled=true;
    try {
      const d=UI.formData('personnelForm');
      if(editingPersonnelId){await API.updatePersonnel(editingPersonnelId,d); UI.toast('Personel güncellendi.','success');}
      else{await API.addPersonnel(d); UI.toast('Personel eklendi.','success');}
      UI.closeModal('personnelModal'); loadPersonnel();
    }catch(e){UI.toast(e.message,'error');}finally{btn.disabled=false;}
  }
  function deletePersonnel(id, name) {
    UI.confirm(`"${name}" silinecek.`, async()=>{ try{await API.deletePersonnel(id); UI.toast('Silindi.','success'); loadPersonnel();}catch(e){UI.toast(e.message,'error');} });
  }

  /* ════════════ OPERATORS ════════════ */
  async function loadOperators() {
    const container = document.getElementById('operatorList'); if (!container) return;
    try {
      const ops = await API.getOperators();
      container.innerHTML = ops.length
        ? `<div style="display:flex;flex-wrap:wrap;gap:8px">${ops.map(o => `
          <div style="display:flex;align-items:center;gap:8px;background:var(--bg-primary);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border)">
            ${UI.operatorBadge(o.name)}
            <button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deleteOperator(${o.id},'${o.name}')" title="Sil">${delIcon()}</button>
          </div>`).join('')}</div>`
        : '<p class="td-muted">Operatör bulunamadı.</p>';
    } catch(e){if(container)container.innerHTML=`<p style="color:var(--danger)">${e.message}</p>`;}
  }
  async function addOperator() {
    const name = document.getElementById('newOperatorName').value.trim();
    if (!name) return UI.toast('Operatör adı girin.','error');
    try { await API.addOperator({name}); UI.toast('Operatör eklendi.','success'); document.getElementById('newOperatorName').value=''; loadOperators(); }
    catch(e){UI.toast(e.message,'error');}
  }
  function deleteOperator(id, name) {
    UI.confirm(`"${name}" silinecek.`, async()=>{ try{await API.deleteOperator(id); UI.toast('Silindi.','success'); loadOperators();}catch(e){UI.toast(e.message,'error');} });
  }

  /* ════════════ PASSWORD ════════════ */
  async function changePassword(e) {
    e.preventDefault();
    const np = document.getElementById('newPwd').value;
    if (np !== document.getElementById('newPwd2').value) return UI.toast('Şifreler eşleşmiyor.','error');
    try { await API.changeMyPassword({old_password: document.getElementById('oldPwd').value, new_password: np}); UI.toast('Şifre güncellendi.','success'); document.getElementById('pwdForm').reset(); }
    catch(e){UI.toast(e.message,'error');}
  }

  /* ════════════ UPDATE ════════════ */
  async function checkUpdate() {
    const box = document.getElementById('updateStatusBox');
    const btn = document.getElementById('checkUpdateBtn');
    const applyBtn = document.getElementById('applyUpdateBtn');
    if (!box) return;
    btn.disabled = true;
    box.innerHTML = `<div style="color:var(--text-muted)">⏳ GitHub kontrol ediliyor...</div>`;
    try {
      const s = await API.checkUpdate();
      if (s.upToDate) {
        box.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:22px">✅</span>
            <div>
              <strong>Uygulama güncel!</strong><br>
              <span style="color:var(--text-muted);font-size:12px">Mevcut sürüm: <code>${s.currentCommit}</code></span>
            </div>
          </div>`;
        if (applyBtn) applyBtn.style.display = 'none';
      } else {
        box.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:22px">🆕</span>
            <div>
              <strong>Güncelleme mevcut!</strong><br>
              <span style="color:var(--text-muted);font-size:12px">Mevcut: <code>${s.currentCommit}</code> → Yeni: <code>${s.remoteCommit}</code></span>
            </div>
          </div>
          <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;font-size:12px">
            <strong>Son değişiklik:</strong> ${s.latestMessage}<br>
            <span style="color:var(--text-muted)">${s.latestDate}</span>
          </div>`;
        if (applyBtn) applyBtn.style.display = 'inline-flex';
      }
    } catch (err) {
      box.innerHTML = `<div style="color:var(--danger)">❌ Hata: ${err.message}</div>`;
    } finally {
      btn.disabled = false;
    }
  }

  async function applyUpdate() {
    const box = document.getElementById('updateStatusBox');
    const applyBtn = document.getElementById('applyUpdateBtn');
    const checkBtn = document.getElementById('checkUpdateBtn');
    if (!box) return;
    if (!confirm('Güncelleme uygulanacak ve uygulama otomatik yeniden başlatılacak. Devam edilsin mi?')) return;
    applyBtn.disabled = true;
    checkBtn.disabled = true;
    box.innerHTML = `<div style="color:var(--text-muted)">⏳ Güncelleme indiriliyor (git pull)...</div>`;
    try {
      const r = await API.applyUpdate();
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:22px">🎉</span>
          <div><strong>${r.message}</strong></div>
        </div>
        <div style="background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;font-size:11px;color:var(--text-muted);white-space:pre-wrap;font-family:monospace">${r.detail}</div>
        <div id="reloadCountdown" style="margin-top:10px;font-size:12px;color:var(--text-muted)">Sayfa 5 saniye içinde yenileniyor...</div>`;
      let t = 5;
      const iv = setInterval(() => {
        t--;
        const el = document.getElementById('reloadCountdown');
        if (el) el.textContent = `Sayfa ${t} saniye içinde yenileniyor...`;
        if (t <= 0) { clearInterval(iv); window.location.reload(); }
      }, 1000);
    } catch (err) {
      box.innerHTML = `<div style="color:var(--danger)">❌ Güncelleme başarısız: ${err.message}</div>`;
      applyBtn.disabled = false;
      checkBtn.disabled = false;
    }
  }

  /* ── Icon helpers ── */
  function editIcon() { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`; }
  function delIcon()  { return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`; }

  return {
    render, switchTab,
    loadUsers, openAddUser, openEditUser, saveUser, deleteUser,
    onRoleChange, onPermViewChange, onPermEditChange,
    loadVehicles, openAddVehicle, openEditVehicle, saveVehicle, deleteVehicle,
    loadLocations, openAddLocation, openEditLocation, saveLocation, deleteLocation,
    loadPersonnel, openAddPersonnel, openEditPersonnel, savePersonnel, deletePersonnel,
    loadOperators, addOperator, deleteOperator,
    changePassword,
    checkUpdate, applyUpdate
  };
})();
