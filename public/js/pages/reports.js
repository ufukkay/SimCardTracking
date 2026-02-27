/* ─── RAPORLAR SAYFASI ─── */
const ReportsPage = (() => {

  function render() {
    document.getElementById('pageTitle').textContent = 'Raporlar';
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="ReportsPage.exportExcel()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Excel İndir
      </button>
    `;

    document.getElementById('pageContent').innerHTML = `
      <div class="filters" style="margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;">
        <input type="date" id="repStartDate" class="form-control" title="Başlangıç Tarihi">
        <input type="date" id="repEndDate" class="form-control" title="Bitiş Tarihi">
        <select id="repOperator" class="form-control" style="width:160px">
          <option value="">Tüm Operatörler</option>
        </select>
        <select id="repStatus" class="form-control" style="width:140px">
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="spare">Yedek</option>
          <option value="passive">Pasif</option>
        </select>
        <button class="btn btn-primary" onclick="ReportsPage.load()">Filtrele</button>
      </div>
      <div id="reportContainer">${UI.loading()}</div>
    `;

    Promise.all([API.getOperators()]).then(([ops]) => {
      const opSel = document.getElementById('repOperator');
      ops.forEach(o => { opSel.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
    });

    load();
  }

  let currentData = null;

  async function load() {
    const container = document.getElementById('reportContainer');
    container.innerHTML = UI.loading();

    const filters = {
      startDate: document.getElementById('repStartDate')?.value || null,
      endDate: document.getElementById('repEndDate')?.value || null,
      operator: document.getElementById('repOperator')?.value || null,
      status: document.getElementById('repStatus')?.value || null
    };

    try {
      const resp = await API.post('/reports/advanced', filters);
      currentData = resp;
      const { summary, lists } = resp;
      const { totals, byOperator, byStatus } = summary;

      // Group operators flat for cards
      const allOps = {};
      [...byOperator.m2m, ...byOperator.data, ...byOperator.voice].forEach(r => {
        allOps[r.key] = (allOps[r.key] || 0) + r.count;
      });

      container.innerHTML = `
        <!-- Özet Kartlar -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Toplam Hat</div>
            <div class="stat-value" style="color:var(--accent)">${totals.all}</div>
            <div class="stat-sub">Tüm tipler</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">🚗 M2M Hatları</div>
            <div class="stat-value">${totals.m2m}</div>
            <div class="stat-sub">Araç SIM'leri</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">🌐 Data Hatları</div>
            <div class="stat-value">${totals.data}</div>
            <div class="stat-sub">Lokasyon SIM'leri</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">📞 Ses Hatları</div>
            <div class="stat-value">${totals.voice}</div>
            <div class="stat-sub">Personel SIM'leri</div>
          </div>
          ${Object.entries(allOps).map(([op, count]) => `
          <div class="stat-card">
            <div class="stat-label">${UI.operatorBadge(op)}</div>
            <div class="stat-value">${count}</div>
            <div class="stat-sub">Toplam hat</div>
          </div>`).join('')}
        </div>

        <!-- Durum Tablosu -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">Durum Dağılımı</span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Tip</th><th>Aktif</th><th>Yedek</th><th>Pasif</th></tr></thead>
              <tbody>
                ${[['M2M', byStatus.m2m], ['Data', byStatus.data], ['Ses', byStatus.voice]].map(([label, stats]) => {
                  const get = (s) => (stats.find(r => r.key === s)?.count || 0);
                  return `<tr>
                    <td><strong>${label}</strong></td>
                    <td>${UI.statusBadge('active')} ${get('active')}</td>
                    <td>${UI.statusBadge('spare')} ${get('spare')}</td>
                    <td>${UI.statusBadge('passive')} ${get('passive')}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- M2M Detay -->
        <div class="card report-section">
          <div class="card-header"><span class="card-title">🚗 M2M — Plaka Bazlı</span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Plaka</th><th>Araç Tipi</th><th>Telefon No</th><th>ICCID</th><th>Operatör</th><th>Durum</th><th>Kayıt Tarihi</th></tr></thead>
              <tbody>
                ${lists.m2m.length ? lists.m2m.map(r => `
                <tr>
                  <td><strong>${r.plate_no || '—'}</strong></td>
                  <td>${r.vehicle_type || '—'}</td>
                  <td>${r.phone_no || '—'}</td>
                  <td class="td-muted" style="font-size:12px;font-family:monospace">${r.iccid || '—'}</td>
                  <td>${UI.operatorBadge(r.operator)}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                  <td class="td-muted">${new Date(r.created_at).toLocaleDateString()}</td>
                </tr>`).join('') : `<tr><td colspan="7">${UI.emptyState('🚗', 'M2M kaydı yok')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Data Detay -->
        <div class="card report-section">
          <div class="card-header"><span class="card-title">🌐 Data — Lokasyon Bazlı</span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Lokasyon</th><th>Telefon No</th><th>ICCID</th><th>Operatör</th><th>Durum</th><th>Kayıt Tarihi</th></tr></thead>
              <tbody>
                ${lists.data.length ? lists.data.map(r => `
                <tr>
                  <td><strong>${r.location || '—'}</strong></td>
                  <td>${r.phone_no || '—'}</td>
                  <td class="td-muted" style="font-size:12px;font-family:monospace">${r.iccid || '—'}</td>
                  <td>${UI.operatorBadge(r.operator)}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                  <td class="td-muted">${new Date(r.created_at).toLocaleDateString()}</td>
                </tr>`).join('') : `<tr><td colspan="6">${UI.emptyState('🌐', 'Data kaydı yok')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ses Detay -->
        <div class="card report-section">
          <div class="card-header"><span class="card-title">📞 Ses — Personel Bazlı</span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Personel</th><th>Departman</th><th>Şirket</th><th>Telefon No</th><th>Operatör</th><th>Durum</th><th>Kayıt Tarihi</th></tr></thead>
              <tbody>
                ${lists.voice.length ? lists.voice.map(r => `
                <tr>
                  <td><strong>${r.assigned_to || '—'}</strong></td>
                  <td class="td-muted">${r.department || '—'}</td>
                  <td class="td-muted">${r.assigned_company || '—'}</td>
                  <td>${r.phone_no || '—'}</td>
                  <td>${UI.operatorBadge(r.operator)}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                  <td class="td-muted">${new Date(r.created_at).toLocaleDateString()}</td>
                </tr>`).join('') : `<tr><td colspan="7">${UI.emptyState('📞', 'Ses kaydı yok')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
  }

  function exportExcel() {
    if (!currentData) return UI.toast('Dışa aktarılacak veri yok.', 'error');
    if (typeof XLSX === 'undefined') return UI.toast('Excel kütüphanesi yüklenemedi.', 'error');

    const wb = XLSX.utils.book_new();
    const { lists, summary } = currentData;

    // --- Özet Sayfası ---
    const summaryData = [
      ['Rapor Özeti', ''],
      ['Olusturma Tarihi', new Date().toLocaleString()],
      ['', ''],
      ['Modül', 'Toplam Hat Sayısı'],
      ['M2M', summary.totals.m2m],
      ['Data', summary.totals.data],
      ['Ses', summary.totals.voice],
      ['GENEL TOPLAM', summary.totals.all]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

    // --- M2M Sayfası ---
    if (lists.m2m.length > 0) {
      const m2mData = lists.m2m.map(r => ({
        'ICCID': r.iccid || '',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || '',
        'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
        'Araç Tipi / Kullanım Amacı': r.vehicle_type || '',
        'Plaka': r.plate_no || '',
        'Notlar': r.notes || '',
        'Kayıt Tarihi': new Date(r.created_at).toLocaleDateString()
      }));
      const wsM2m = XLSX.utils.json_to_sheet(m2mData);
      wsM2m['!cols'] = [{wch:22}, {wch:15}, {wch:15}, {wch:10}, {wch:25}, {wch:15}, {wch:30}, {wch:15}];
      XLSX.utils.book_append_sheet(wb, wsM2m, 'M2M Hatları');
    }

    // --- Data Sayfası ---
    if (lists.data.length > 0) {
      const dbData = lists.data.map(r => ({
        'ICCID': r.iccid || '',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || '',
        'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
        'Lokasyon': r.location || '',
        'Notlar': r.notes || '',
        'Kayıt Tarihi': new Date(r.created_at).toLocaleDateString()
      }));
      const wsData = XLSX.utils.json_to_sheet(dbData);
      wsData['!cols'] = [{wch:22}, {wch:15}, {wch:15}, {wch:10}, {wch:25}, {wch:30}, {wch:15}];
      XLSX.utils.book_append_sheet(wb, wsData, 'Data Hatları');
    }

    // --- Ses Sayfası ---
    if (lists.voice.length > 0) {
      const vData = lists.voice.map(r => ({
        'ICCID': r.iccid || '',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || '',
        'Durum': r.status === 'active' ? 'Aktif' : r.status === 'spare' ? 'Yedek' : 'Pasif',
        'Personel Adı': r.assigned_to || '',
        'Departman': r.department || '',
        'Şirket': r.assigned_company || '',
        'Notlar': r.notes || '',
        'Kayıt Tarihi': new Date(r.created_at).toLocaleDateString()
      }));
      const wsVoice = XLSX.utils.json_to_sheet(vData);
      wsVoice['!cols'] = [{wch:22}, {wch:15}, {wch:15}, {wch:10}, {wch:25}, {wch:20}, {wch:20}, {wch:30}, {wch:15}];
      XLSX.utils.book_append_sheet(wb, wsVoice, 'Ses Hatları');
    }

    XLSX.writeFile(wb, `SIM_Takip_Raporu_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return { render, load, exportExcel };
})();
