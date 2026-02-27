/* ─── RAPORLAR SAYFASI ─── */
const ReportsPage = (() => {

  function render() {
    document.getElementById('pageTitle').textContent = 'Raporlar';
    document.getElementById('pageContent').innerHTML = `<div>${UI.loading()}</div>`;
    load();
  }

  async function load() {
    try {
      const [summary, m2mList, dataList, voiceList] = await Promise.all([
        API.getSummary(),
        API.getReportM2M(),
        API.getReportData(),
        API.getReportVoice()
      ]);

      const { totals, byOperator, byStatus } = summary;

      // Operator Totals
      const allOps = {};
      [...byOperator.m2m, ...byOperator.data, ...byOperator.voice].forEach(r => {
        allOps[r.operator] = (allOps[r.operator] || 0) + r.count;
      });

      document.getElementById('pageContent').innerHTML = `
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
                  const get = (s) => (stats.find(r => r.status === s)?.count || 0);
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
              <thead><tr><th>Plaka</th><th>Telefon No</th><th>ICCID</th><th>Operatör</th><th>Durum</th><th>Notlar</th></tr></thead>
              <tbody>
                ${m2mList.length ? m2mList.map(r => `
                <tr>
                  <td><strong>${r.plate_no || '—'}</strong></td>
                  <td>${r.phone_no || '—'}</td>
                  <td class="td-muted" style="font-size:12px;font-family:monospace">${r.iccid || '—'}</td>
                  <td>${UI.operatorBadge(r.operator)}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                  <td class="td-muted">${r.notes || '—'}</td>
                </tr>`).join('') : `<tr><td colspan="6">${UI.emptyState('🚗', 'M2M kaydı yok')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Data Detay -->
        <div class="card report-section">
          <div class="card-header"><span class="card-title">🌐 Data — Lokasyon Bazlı</span></div>
          <div class="table-container">
            <table>
              <thead><tr><th>Lokasyon</th><th>Telefon No</th><th>ICCID</th><th>Operatör</th><th>Durum</th><th>Notlar</th></tr></thead>
              <tbody>
                ${dataList.length ? dataList.map(r => `
                <tr>
                  <td><strong>${r.location || '—'}</strong></td>
                  <td>${r.phone_no || '—'}</td>
                  <td class="td-muted" style="font-size:12px;font-family:monospace">${r.iccid || '—'}</td>
                  <td>${UI.operatorBadge(r.operator)}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                  <td class="td-muted">${r.notes || '—'}</td>
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
              <thead><tr><th>Personel</th><th>Departman</th><th>Şirket</th><th>Telefon No</th><th>Operatör</th><th>Durum</th></tr></thead>
              <tbody>
                ${voiceList.length ? voiceList.map(r => `
                <tr>
                  <td><strong>${r.assigned_to || '—'}</strong></td>
                  <td class="td-muted">${r.department || '—'}</td>
                  <td class="td-muted">${r.assigned_company || '—'}</td>
                  <td>${r.phone_no || '—'}</td>
                  <td>${UI.operatorBadge(r.operator)}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                </tr>`).join('') : `<tr><td colspan="6">${UI.emptyState('📞', 'Ses kaydı yok')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      document.getElementById('pageContent').innerHTML = `<p style="color:var(--danger)">${err.message}</p>`;
    }
  }

  return { render, load };
})();
