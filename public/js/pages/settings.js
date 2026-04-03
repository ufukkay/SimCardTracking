/* ─── AYARLAR SAYFASI (FULL REWRITE) ─── */
const PERMISSION_MODULES = ['m2m','data','voice','invoices'];

const SettingsPage = (() => {
  let editingUserId = null;
  let editingVehicleId = null;
  let editingLocationId = null;
  let editingPersonnelId = null;
  const selectedPersonnelIds = new Set();

  /* ════════════ RENDER ════════════ */
  function render() {
    document.getElementById('pageTitle').textContent = 'Ayarlar';
    document.getElementById('pageContent').innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" onclick="SettingsPage.switchTab('users',this)" data-i18n="nav_users">👥 Kullanıcılar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('vehicles',this)" data-i18n="nav_vehicles">🚗 Araçlar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('locations',this)" data-i18n="nav_locations">📍 Lokasyonlar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('personnelTab',this)" data-i18n="nav_personnel">👤 Personeller</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('operators',this)" data-i18n="nav_operators">📡 Operatörler</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('packages',this)" data-i18n="nav_packages">📦 Paketler</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('importAll',this)" data-i18n="nav_import">📲 Hat Aktar</button>
        <button class="tab-btn" onclick="SettingsPage.switchTab('profile',this)" data-i18n="nav_profile">🔐 Şifre Değiştir</button>
        <button class="tab-btn" id="updateTabBtn" onclick="SettingsPage.switchTab('update',this)" style="display:none" data-i18n="nav_update">🔄 Güncelleme</button>
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
            <div style="display:flex; gap:10px; align-items:center; margin-left:auto">
              <div id="personnelBulkActionsBar" class="bulk-actions-bar" style="display:none">
                <span id="personnelSelectedCount">0 kayıt seçildi</span>
                <div class="bulk-buttons">
                  <button class="btn btn-secondary btn-sm" id="personnelBulkBtn" onclick="SettingsPage.openBulkEditPersonnel()" disabled>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Toplu Düzenle</span>
                  </button>
                  <button class="btn btn-danger btn-sm" id="personnelBulkDeleteBtn" onclick="SettingsPage.bulkDeletePersonnel()" disabled>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    <span>Toplu Sil</span>
                  </button>
                </div>
              </div>
              <button class="btn btn-primary" onclick="SettingsPage.openAddPersonnel()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Yeni Personel
              </button>
            </div>
          </div>
          <div class="table-container">
            <table><thead><tr><th style="width:32px"><input type="checkbox" id="personnelSelectAll" onclick="SettingsPage.toggleAllPersonnel(this)"></th><th>#</th><th>Ad Soyad</th><th>Departman</th><th>Şirket</th><th>Masraf Kalemi</th><th>Telefon</th><th>Notlar</th><th>İşlem</th></tr></thead>
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

      <!-- PAKETLER -->
      <div class="tab-pane" id="tab-packages">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Paket (Tarife) Yönetimi</span>
            <div style="display:flex;gap:10px">
              <button class="btn btn-secondary" onclick="SettingsPage.exportExcelPackages()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Excel'e Aktar
              </button>
              <button class="btn btn-primary" onclick="SettingsPage.openCombinedPackageModal()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Paket Ekle / Yükle
              </button>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Adı</th>
                  <th>Operatör</th>
                  <th>Tipi</th>
                  <th>Data (GB)</th>
                  <th>SMS</th>
                  <th>Dakika</th>
                  <th>Açıklama</th>
                  <th>Fiyat</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody id="packagesList"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- HAT AKTARIMI SİSTEMİ (UNIFIED) -->
      <div class="tab-pane" id="tab-importAll">
        <div class="card">
          <div class="card-header">
            <span class="card-title">📲 Hat Aktarımı</span>
          </div>
          
          <div class="sub-tabs" style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border-light); padding-bottom:10px;">
            <button class="btn sub-tab-btn active" style="background:var(--accent-light); color:var(--accent); font-weight:600; border-color:var(--accent)" onclick="SettingsPage.switchImportType('m2m', this)">🚗 M2M Hatları</button>
            <button class="btn btn-ghost sub-tab-btn" onclick="SettingsPage.switchImportType('data', this)">🌐 Data Hatları</button>
            <button class="btn btn-ghost sub-tab-btn" onclick="SettingsPage.switchImportType('voice', this)">📞 Ses Hatları</button>
          </div>

          <div id="import-type-pane-m2m" class="import-type-pane active">
            <div id="import-container-m2m"><div class="loading-overlay"><div class="spinner"></div></div></div>
          </div>
          <div id="import-type-pane-data" class="import-type-pane" style="display:none">
            <div id="import-container-data"><div class="loading-overlay"><div class="spinner"></div></div></div>
          </div>
          <div id="import-type-pane-voice" class="import-type-pane" style="display:none">
            <div id="import-container-voice"><div class="loading-overlay"><div class="spinner"></div></div></div>
          </div>
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

        <div class="card" style="max-width:560px">
          <div class="card-header"><span class="card-title">📜 Güncelleme Geçmişi & Planlar</span></div>
          <div id="changelogContainer" class="changelog-container" style="padding:10px 0">
            <div class="loading-overlay" style="position:static;height:100px"><div class="spinner"></div></div>
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
                   <tr style="border-top:1px solid var(--border)">
                     <td style="padding:8px 4px">📄 Faturalar</td>
                     <td style="text-align:center"><input type="checkbox" id="perm_invoices_view" onchange="SettingsPage.onPermViewChange('invoices',this)"></td>
                     <td style="text-align:center"><input type="checkbox" id="perm_invoices_edit" onchange="SettingsPage.onPermEditChange('invoices',this)"></td>
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

      <!-- Paket (Tarife) -->
      <div class="modal-overlay" id="packageModal">
        <div class="modal" style="max-width:420px">
          <div class="modal-header"><span class="modal-title" id="packageModalTitle">Yeni Paket</span><button class="modal-close" onclick="UI.closeModal('packageModal')">×</button></div>
          <form class="modal-body" id="packageForm" onsubmit="SettingsPage.savePackage(event)">
            <div class="form-group"><label class="form-label">Paket Adı *</label><input name="name" class="form-control" placeholder="Örn: 10GB Data Planı" required></div>
            <div class="form-group">
              <label class="form-label">Paket Tipi *</label>
              <select name="type" class="form-control" required>
                <option value="m2m">M2M Hattı</option>
                <option value="data">Data Hattı</option>
                <option value="voice">Ses Hattı</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Operatör *</label>
              <select name="operator_id" class="form-control settingsOperatorSel" required></select>
            </div>
            <div class="form-group"><label class="form-label">Data Limiti (GB)</label><input type="number" step="0.01" name="data_limit" class="form-control" placeholder="Örn: 10"></div>
            <div class="form-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
              <div class="form-group"><label class="form-label">SMS (Adet)</label><input type="number" name="sms_limit" class="form-control" placeholder="Örn: 1000"></div>
              <div class="form-group"><label class="form-label">Dakika</label><input type="number" name="minutes_limit" class="form-control" placeholder="Örn: 500"></div>
            </div>
            <div class="form-group"><label class="form-label">Aylık Fiyat (₺)</label><input type="number" step="0.01" name="price" class="form-control" placeholder="0.00"></div>
            <div class="form-group"><label class="form-label">Ek Açıklama / Özellikler</label><input name="features" class="form-control" placeholder="Örn: Sınırsız WhatsApp"></div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('packageModal')">İptal</button><button class="btn btn-primary" id="packageSaveBtn" onclick="document.getElementById('packageForm').requestSubmit()">Kaydet</button></div>
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
              <div class="form-group"><label class="form-label">Masraf Kalemi</label><input name="cost_center" class="form-control" placeholder="Örn: IT123"></div>
              <div class="form-group"><label class="form-label">Telefon</label><input name="phone" class="form-control"></div>
              <div class="form-group col-span-2"><label class="form-label">Notlar</label><textarea name="notes" class="form-control"></textarea></div>
            </div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('personnelModal')">İptal</button><button class="btn btn-primary" id="personnelSaveBtn" onclick="document.getElementById('personnelForm').requestSubmit()">Kaydet</button></div>
        </div>
      </div>

      <div class="modal-overlay" id="personnelBulkModal">
        <div class="modal" style="max-width:480px">
          <div class="modal-header"><span class="modal-title">Toplu Personel Düzenle</span><button class="modal-close" onclick="UI.closeModal('personnelBulkModal')">×</button></div>
          <form class="modal-body" id="personnelBulkForm" onsubmit="SettingsPage.saveBulkPersonnel(event)">
            <p style="margin-bottom:14px;font-size:13px;color:var(--text-muted)">Seçili <strong id="bulkPersonnelCount">0</strong> personelin aşağıdaki alanlarını güncelleyebilirsiniz. Boş bıraktığınız alanlar değişmez.</p>
            <div class="form-group"><label class="form-label">Departman</label><input name="department" class="form-control" placeholder="Örn: IT"></div>
            <div class="form-group"><label class="form-label">Şirket</label><input name="company" class="form-control" placeholder="Örn: Talay Logistic"></div>
            <div class="form-group"><label class="form-label">Masraf Kalemi</label><input name="cost_center" class="form-control" placeholder="Örn: IT-123"></div>
            <div class="form-group"><label class="form-label">Telefon</label><input name="phone" class="form-control" placeholder="05xx xxx xx xx"></div>
            <div class="form-group"><label class="form-label">Notlar</label><textarea name="notes" class="form-control" rows="2" placeholder="Ek bilgi..."></textarea></div>
          </form>
          <div class="modal-footer"><button class="btn btn-secondary" onclick="UI.closeModal('personnelBulkModal')">İptal</button><button class="btn btn-primary" id="personnelBulkSaveBtn" onclick="document.getElementById('personnelBulkForm').requestSubmit()">Güncelle</button></div>
        </div>
      </div>
    `;

    loadUsers();
    loadVehicles();
    loadLocations();
    loadPersonnel();
    loadOperators();
    loadPackages();
    
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
    if (tab === 'importAll') {
      const activeSubBtn = document.querySelector('.sub-tab-btn.active');
      if (activeSubBtn) {
        // Trigger the active sub-tab's logic if it hasn't been rendered
        const subType = activeSubBtn.textContent.toLowerCase().includes('m2m') ? 'm2m' : 
                        activeSubBtn.textContent.toLowerCase().includes('data') ? 'data' : 'voice';
        const containerId = `import-container-${subType}`;
        const container = document.getElementById(containerId);
        if (container && container.querySelector('.spinner')) {
          BulkImport.renderTab(subType, containerId, null);
        }
      }
    }

    if (tab === 'update') {
      loadChangelog();
    }
    
    if (tab === 'update') {
      SettingsPage.checkUpdate();
    }
    if (tab === 'packages') {
      loadPackages();
    }
  }

  function switchImportType(type, btn) {
    document.querySelectorAll('.sub-tab-btn').forEach(b => {
      b.classList.remove('active');
      b.classList.add('btn-ghost');
      b.style.background = '';
      b.style.color = '';
      b.style.borderColor = '';
      b.style.fontWeight = '';
    });
    
    btn.classList.remove('btn-ghost');
    btn.classList.add('active');
    btn.style.background = 'var(--accent-light)';
    btn.style.color = 'var(--accent)';
    btn.style.borderColor = 'var(--accent)';
    btn.style.fontWeight = '600';

    // Toggle panes
    document.querySelectorAll('.import-type-pane').forEach(p => {
      p.style.display = 'none';
      p.classList.remove('active');
    });
    const paneId = `import-type-pane-${type}`;
    const targetPane = document.getElementById(paneId);
    if (targetPane) {
      targetPane.style.display = 'block';
      targetPane.classList.add('active');
    }
    
    // Within the pane, find the currently active bulk-tab (e.g. st-add-m2m)
    // and ensure IT has the 'active' class too (in case user switched sub-tabs)
    const activeBulkTab = targetPane?.querySelector('.tab-pane.active');
    if (!activeBulkTab) {
      // Default to the first one (usually 'Yeni Ekle')
      targetPane?.querySelector('.tab-pane')?.classList.add('active');
    }
    
    const containerId = `import-container-${type}`;
    const container = document.getElementById(containerId);
    if (container && container.querySelector('.spinner')) {
      BulkImport.renderTab(type, containerId, null);
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
      formData.role = (formData.role || 'user').toLowerCase();
      UI.setForm('userForm', formData);

      document.getElementById('usernameField').readOnly = true;
      document.getElementById('userPwdInput').required = false;

      // Open modal first so DOM elements exist
      UI.openModal('userModal');

      // Then set role & permissions (after modal is visible/rendered)
      const role = formData.role;
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
      const perms = {};
      PERMISSION_MODULES.forEach(mod => {
        perms[mod] = {
          view: document.getElementById(`perm_${mod}_view`)?.checked || false,
          edit: document.getElementById(`perm_${mod}_edit`)?.checked || false,
        };
      });
      data.permissions = perms;
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
    PERMISSION_MODULES.forEach(mod => {
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
      selectedPersonnelIds.clear();
      const master = document.getElementById('personnelSelectAll');
      if (master) master.checked = false;
      updatePersonnelBulkBtn();
      
      const userStr = localStorage.getItem('simtrack_user') || '{}';
      const curUser = JSON.parse(userStr);
      const isAdmin = curUser.role === 'admin';

      const rows = await API.getPersonnel();
      tbody.innerHTML = rows.length ? rows.map((r,i) => {
        const fullName = `${r.first_name} ${r.last_name}`;
        // Escape single quotes for the onclick handler
        const escapedName = fullName.replace(/'/g, "\\'");
        
        return `
        <tr>
          <td><input type="checkbox" class="personnel-check" data-id="${r.id}" onclick="SettingsPage.togglePersonnelSelection(${r.id}, this.checked)"></td>
          <td class="td-muted">${i+1}</td>
          <td><strong>${fullName}</strong></td>
          <td class="td-muted">${r.department || '—'}</td>
          <td class="td-muted">${r.company || '—'}</td>
          <td class="td-muted">${r.cost_center || '—'}</td>
          <td class="td-muted">${r.phone || '—'}</td>
          <td class="td-muted">${r.notes || '—'}</td>
          <td>
            <div class="action-buttons">
              ${isAdmin ? `
                <button class="btn btn-secondary btn-sm btn-icon" onclick="SettingsPage.openEditPersonnel(${r.id})" title="Düzenle">${editIcon()}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deletePersonnel(${r.id},'${escapedName}')" title="Sil">${delIcon()}</button>
              ` : '<span class="td-muted" style="font-size:11px">Yetki Yok</span>'}
            </div>
          </td>
        </tr>`;
      }).join('') : `<tr><td colspan="9">${UI.emptyState('👤','Personel kaydı yok','Yeni personel ekleyerek başlayın.')}</td></tr>`;
    } catch(err){if(tbody)tbody.innerHTML=`<tr><td colspan="9" style="color:var(--danger);padding:16px">${err.message}</td></tr>`;}
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

  function updatePersonnelBulkBtn() {
    const count = selectedPersonnelIds.size;
    const bar = document.getElementById('personnelBulkActionsBar');
    const countEl = document.getElementById('personnelSelectedCount');
    const editBtn = document.getElementById('personnelBulkBtn');
    const delBtn = document.getElementById('personnelBulkDeleteBtn');

    if (count > 0) {
      if (bar) bar.style.display = 'flex';
      if (countEl) countEl.textContent = `${count} kayıt seçildi`;
      if (editBtn) editBtn.disabled = false;
      if (delBtn) delBtn.disabled = false;
    } else {
      if (bar) bar.style.display = 'none';
      if (editBtn) editBtn.disabled = true;
      if (delBtn) delBtn.disabled = true;
    }
  }

  function togglePersonnelSelection(id, checked) {
    if (checked) selectedPersonnelIds.add(id);
    else selectedPersonnelIds.delete(id);
    updatePersonnelBulkBtn();
  }

  function toggleAllPersonnel(input) {
    const tbody = document.getElementById('personnelTableBody');
    if (!tbody) return;
    selectedPersonnelIds.clear();
    tbody.querySelectorAll('input.personnel-check').forEach(cb => {
      cb.checked = input.checked;
      if (input.checked) selectedPersonnelIds.add(parseInt(cb.dataset.id, 10));
    });
    updatePersonnelBulkBtn();
  }

  function openBulkEditPersonnel() {
    if (selectedPersonnelIds.size === 0) return UI.toast('Lütfen önce personel seçin.', 'warning');
    document.getElementById('personnelBulkForm').reset();
    document.getElementById('bulkPersonnelCount').textContent = selectedPersonnelIds.size;
    UI.openModal('personnelBulkModal');
  }

  async function saveBulkPersonnel(e) {
    e.preventDefault();
    if (selectedPersonnelIds.size === 0) return UI.toast('Seçili personel bulunmuyor.', 'warning');
    const data = UI.formData('personnelBulkForm');
    const payload = {};
    ['department','company','cost_center','phone','notes'].forEach(key => {
      if (data[key]) payload[key] = data[key];
    });
    if (Object.keys(payload).length === 0) return UI.toast('En az bir alan doldurun.', 'warning');
    const btn = document.getElementById('personnelBulkSaveBtn');
    btn.disabled = true;
    try {
      await API.bulkUpdate('personnel', Array.from(selectedPersonnelIds), payload);
      UI.toast('Seçili personeller güncellendi.', 'success');
      UI.closeModal('personnelBulkModal');
      loadPersonnel();
    } catch (err) {
      UI.toast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  function bulkDeletePersonnel() {
    if (selectedPersonnelIds.size === 0) return UI.toast('Lütfen personel seçin.', 'warning');
    UI.confirm(`Seçili ${selectedPersonnelIds.size} personeli silmek istediğinize emin misiniz?`, async () => {
      try {
        await API.bulkDelete('personnel', Array.from(selectedPersonnelIds));
        UI.toast('Seçili personeller silindi.', 'success');
        loadPersonnel();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });
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

  /* ════════════ PACKAGES ════════════ */
  let editingPackageId = null;
  async function loadPackages() {
    const tbody = document.getElementById('packagesList'); if (!tbody) return;
    try {
      const pkgs = await API.getPackages();
      const typeLabels = { m2m: 'M2M', data: 'Data', voice: 'Ses' };
      tbody.innerHTML = pkgs.length ? pkgs.map(p => `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${UI.operatorBadge(p.operator_name || '—')}</td>
          <td><span class="badge ${p.type === 'm2m' ? 'badge-info' : (p.type === 'data' ? 'badge-primary' : 'badge-warning')}">${typeLabels[p.type] || p.type}</span></td>
          <td class="td-muted"><strong>${p.data_limit != null ? p.data_limit : '—'}</strong></td>
          <td class="td-muted"><strong>${p.sms_limit != null ? p.sms_limit : '—'}</strong></td>
          <td class="td-muted"><strong>${p.minutes_limit != null ? p.minutes_limit : '—'}</strong></td>
          <td class="td-muted" style="font-size:12px">${p.features || '—'}</td>
          <td><strong>${p.price ? p.price + ' ₺' : '—'}</strong></td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-secondary btn-sm btn-icon" onclick="SettingsPage.openPackageModal(${p.id})" title="Düzenle">${editIcon()}</button>
              <button class="btn btn-danger btn-sm btn-icon" onclick="SettingsPage.deletePackage(${p.id}, '${p.name}')" title="Sil">${delIcon()}</button>
            </div>
          </td>
        </tr>`).join('') : `<tr><td colspan="6" class="td-muted" style="padding:24px;text-align:center">Önce sağ üstten "Yeni Paket" butonuna basarak tarife tanımlayın.</td></tr>`;
    } catch(err) { tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">${err.message}</td></tr>`; }
  }

  async function openPackageModal(id = null) {
    editingPackageId = id;
    const form = document.getElementById('packageForm');
    form.reset();
    document.getElementById('packageModalTitle').textContent = id ? 'Paketi Düzenle' : 'Yeni Paket';
    
    // Ensure operators are loaded into the select
    const ops = await API.getOperators();
    const sel = form.querySelector('[name="operator_id"]');
    sel.innerHTML = `<option value="">Seçiniz...</option>` + ops.map(o => `<option value="${o.id}">${o.name}</option>`).join('');

    if (id) {
      try {
        const pkgs = await API.getPackages();
        const p = pkgs.find(x => x.id === id);
        if (p) UI.setForm('packageForm', p);
      } catch (err) { UI.toast(err.message, 'error'); }
    }
    UI.openModal('packageModal');
  }

  async function savePackage(e) {
    e.preventDefault(); const btn = document.getElementById('packageSaveBtn'); btn.disabled = true;
    try {
      const d = UI.formData('packageForm');
      if (editingPackageId) { await API.updatePackage(editingPackageId, d); UI.toast('Paket güncellendi.', 'success'); } 
      else { await API.addPackage(d); UI.toast('Paket eklendi.', 'success'); }
      _pkgsCache = null; // Cache'i temizle — dropdown'lar güncel paketi görsün
      UI.closeModal('packageModal'); loadPackages();
    } catch(err) { UI.toast(err.message, 'error'); } finally { btn.disabled = false; }
  }

  function deletePackage(id, name) {
    UI.confirm(`"${name}" silinecek. Emin misiniz?`, async()=>{ try{await API.deletePackage(id); _pkgsCache = null; UI.toast('Paket silindi.','success'); loadPackages();}catch(e){UI.toast(e.message,'error');} });
  }

  async function openCombinedPackageModal() {
    let overlay = document.getElementById('combinedPackageModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'combinedPackageModalOverlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" style="max-width:860px;width:100%">
          <div class="modal-header">
            <span class="modal-title">Paket Ekle / Yükle</span>
            <button class="modal-close" onclick="UI.closeModal('combinedPackageModalOverlay')">×</button>
          </div>
          <div id="combinedPackageModalBody" style="padding:0 20px 20px"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    UI.openModal('combinedPackageModalOverlay');
    document.getElementById('combinedPackageModalBody').innerHTML = '<div class="spinner" style="margin:40px auto;display:block;"></div>';
    await BulkImport.renderTab('packages', 'combinedPackageModalBody', () => {
      UI.closeModal('combinedPackageModalOverlay');
      loadPackages();
    });
  }

  async function exportExcelPackages() {
    try {
      const XLSX = window.XLSX;
      if (!XLSX) return UI.toast("XLSX kütüphanesi yüklenmedi.", "error");

      UI.toast('Excel dışa aktarma hazırlanıyor...', 'info');

      const pkgs = await API.getPackages();
      if (!pkgs || pkgs.length === 0) {
        return UI.toast("Dışa aktarılacak veri bulunamadı.", "warning");
      }

      const typeLabels = { m2m: 'M2M', data: 'Data', voice: 'Ses' };

      const exportData = pkgs.map(item => ({
        'Paket Adı': item.name || '',
        'Tip': typeLabels[item.type] || item.type || '',
        'Operatör': item.operator_name || '',
        'Data Limit (GB)': item.data_limit != null ? item.data_limit : '',
        'SMS Limit': item.sms_limit != null ? item.sms_limit : '',
        'Dakika Limit': item.minutes_limit != null ? item.minutes_limit : '',
        'Fiyat (₺)': item.price != null ? item.price : '',
        'Özellikler': item.features || '',
        'Oluşturulma': item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const wscols = [
        {wch: 25}, // Paket Adı
        {wch: 10}, // Tip
        {wch: 15}, // Operatör
        {wch: 15}, // Data
        {wch: 12}, // SMS
        {wch: 15}, // Dakika
        {wch: 10}, // Fiyat
        {wch: 40}, // Özellikler
        {wch: 20}  // Oluşturulma
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Paketler");

      const today = new Date();
      const dateStr = `${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2,'0')}${today.getDate().toString().padStart(2,'0')}`;
      XLSX.writeFile(wb, `Paketler_${dateStr}.xlsx`);
      
      UI.toast('Excel başarıyla indirildi.', 'success');
      
    } catch (error) {
      console.error('Export Excel Error:', error);
      UI.toast('Excel dışa aktarılırken hata oluştu: ' + error.message, 'error');
    }
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
  function editIcon() { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`; }
  function delIcon()  { return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`; }


  /* ════════════ DYNAMIC PACKAGE DROPDOWN ════════════ */
  let _pkgsCache = null;
  async function onOperatorChange(operatorNameOrId, simType, targetSelectId) {
    const sel = document.getElementById(targetSelectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Yükleniyor...</option>';
    try {
      if (!_pkgsCache) _pkgsCache = await API.getPackages();
      console.log('[DEBUG] onOperatorChange:', { operatorNameOrId, simType, targetSelectId, cacheSize: _pkgsCache.length });
      if (_pkgsCache.length > 0) console.log('[DEBUG] Sample Package:', _pkgsCache[0]);
      
      let filtered = [];
      if (operatorNameOrId) {
        const opIdOrName = String(operatorNameOrId).trim().toLowerCase();
        
        filtered = _pkgsCache.filter(p => {
          // 1. Tip Kontrolü
          const typeMatch = !simType || p.type === simType;
          
          // 2. Operatör Kontrolü: 
          const opMatch = String(p.operator_id) === opIdOrName || 
                          (p.operator_name || '').trim().toLowerCase() === opIdOrName;
          
          return typeMatch && opMatch;
        });
      }

      if (filtered.length === 0) {
        sel.innerHTML = '<option value="">Paket tanımlanmamış</option>';
        sel.disabled = true;
      } else {
        sel.disabled = false;
        sel.innerHTML = '<option value="">Paket Seç (İsteğe Bağlı)...</option>' + 
          filtered.map(p => {
            const limitText = [
              p.data_limit != null ? p.data_limit + 'GB' : null,
              p.sms_limit != null ? p.sms_limit + 'SMS' : null,
              p.minutes_limit != null ? p.minutes_limit + 'Dk' : null
            ].filter(Boolean).join('/');
            const extra = limitText ? ` (${limitText})` : '';
            return `<option value="${p.id}">${p.name}${extra}${p.price ? ' — ' + p.price + '₺' : ''}</option>`;
          }).join('');
      }
    } catch (e) {
      sel.innerHTML = '<option value="">Hata!</option>';
      console.error('onOperatorChange error:', e);
    }
  }

  async function loadChangelog() {
    const container = document.getElementById('changelogContainer');
    if (!container) return;

    try {
      const resp = await fetch('/changelog.json');
      const data = await resp.json();

      let html = '';
      data.forEach(item => {
        const changesHtml = item.changes.map(c => `<li>${c}</li>`).join('');
        const statusBadge = item.status === 'completed' ? 
          '<span class="badge badge-success" style="font-size:10px">Tamamlandı</span>' : 
          '<span class="badge badge-info" style="font-size:10px">Planlandı</span>';

        html += `
          <div class="changelog-item ${item.status}">
            <div class="changelog-header">
              <span class="changelog-version">${item.version}</span>
              ${statusBadge}
              <span class="changelog-date">${item.date}</span>
            </div>
            <span class="changelog-title">${item.title}</span>
            <ul class="changelog-list">
              ${changesHtml}
            </ul>
          </div>
        `;
      });
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger);font-size:12px">Hata: Güncelleme geçmişi yüklenemedi.</div>`;
    }
  }

  return {
    render, switchTab, switchImportType, loadChangelog,
    loadUsers, openAddUser, openEditUser, saveUser, deleteUser,
    onRoleChange, onPermViewChange, onPermEditChange,
    loadVehicles, openAddVehicle, openEditVehicle, saveVehicle, deleteVehicle,
    loadLocations, openAddLocation, openEditLocation, deleteLocation, saveLocation,
    loadPersonnel, openAddPersonnel, openEditPersonnel, deletePersonnel, savePersonnel,
    togglePersonnelSelection, toggleAllPersonnel, openBulkEditPersonnel, saveBulkPersonnel, bulkDeletePersonnel,
    loadOperators, addOperator, deleteOperator,
    loadPackages, onOperatorChange,
    exportExcelPackages, openCombinedPackageModal,
    
    openPackageModal, deletePackage, savePackage,
    checkUpdate, applyUpdate,
    changePassword
  };
})();
