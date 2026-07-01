/* ─── RAPORLAR SAYFASI ─── */
const ReportsPage = (() => {
  let activeTab = 'lines'; // 'lines' veya 'financial'
  let currentData = null; // Hat dağılımı verisi
  let financialData = null; // Finansal rapor verisi
  let targetPeriod = '';
  let comparePeriod = '';

  // Filtreleme ve arama durumları
  let financialFilterText = '';
  let financialColFilters = {};
  let ownershipColFilters = {};
  let threeMonthsColFilters = {};

  const normalizeName = (name) => (name || '').trim().toLocaleLowerCase('tr-TR');

  function buildHoldersLineCounts(lineOwnership) {
    const counts = {};
    if (lineOwnership) {
      lineOwnership.forEach(o => {
        const key = normalizeName(o.holder);
        counts[key] = (counts[key] || 0) + o.count;
      });
    }
    return counts;
  }

  function render() {
    document.getElementById('pageTitle').textContent = i18n.t('nav_reports') || 'Raporlar';
    
    // Topbar Actions (Excel ve PDF)
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-secondary" onclick="ReportsPage.exportExcel()" style="margin-right: 8px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <span data-i18n="export_excel">${i18n.t('export_excel') || 'Excel'}</span>
      </button>
      <button class="btn btn-secondary" onclick="ReportsPage.exportPDF()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <span>PDF</span>
      </button>
    `;

    // Page Content with Tabs
    document.getElementById('pageContent').innerHTML = `
      <style>
        .report-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid var(--border-light);
          margin-bottom: 24px;
          padding-bottom: 2px;
        }
        .report-tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
          margin-bottom: -4px;
        }
        .report-tab-btn:hover {
          color: var(--accent);
        }
        .report-tab-btn.active {
          color: var(--accent);
          border-bottom: 2px solid var(--accent);
        }
        .progress-bar-container {
          background: var(--bg-hover);
          border-radius: 4px;
          height: 6px;
          overflow: hidden;
          width: 100%;
          margin-top: 4px;
        }
        .progress-bar-fill {
          background: var(--accent);
          height: 100%;
          border-radius: 4px;
        }
        .metric-comparison {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .metric-comparison.up {
          color: var(--danger);
        }
        .metric-comparison.down {
          color: var(--success);
        }
        .financial-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 20px;
          align-items: start;
        }
        .sortable-header {
          cursor: pointer;
          user-select: none;
          transition: var(--transition);
        }
        .sortable-header:hover {
          background-color: var(--bg-hover);
          color: var(--accent);
        }
        @media (max-width: 1024px) {
          .financial-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="report-tabs">
        <button class="report-tab-btn ${activeTab === 'lines' ? 'active' : ''}" id="tabLines" onclick="ReportsPage.switchTab('lines')">
          📊 Hat Dağılım Raporu
        </button>
        <button class="report-tab-btn ${activeTab === 'financial' ? 'active' : ''}" id="tabFinancial" onclick="ReportsPage.switchTab('financial')">
          💼 Finansal & Mali Analiz
        </button>
      </div>

      <div id="reportFilters"></div>
      <div id="reportContainer">${UI.loading()}</div>
    `;

    renderFilters();
    load();
  }

  function switchTab(tab) {
    if (activeTab === tab) return;
    activeTab = tab;
    
    // Sıralama ve arama durumlarını sıfırla
    financialFilterText = '';
    sortByField = 'total_payable';
    sortDirection = 'desc';

    document.getElementById('tabLines').classList.toggle('active', tab === 'lines');
    document.getElementById('tabFinancial').classList.toggle('active', tab === 'financial');
    
    renderFilters();
    load();
  }

  function renderFilters() {
    const filtersDiv = document.getElementById('reportFilters');
    
    if (activeTab === 'lines') {
      filtersDiv.innerHTML = `
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
      `;
      
      API.getOperators().then(ops => {
        const opSel = document.getElementById('repOperator');
        if (opSel) {
          ops.forEach(o => { opSel.innerHTML += `<option value="${o.name}">${o.name}</option>`; });
        }
      });
    } else {
      // Financial filters
      filtersDiv.innerHTML = `
        <div class="filters" style="margin-bottom:20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <div style="display:flex; flex-direction:column; gap:4px">
            <label style="font-size:11px; font-weight:700; color:var(--text-muted)">Rapor Dönemi (Hedef)</label>
            <select id="finTargetPeriod" class="form-control" style="width:150px"></select>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px">
            <label style="font-size:11px; font-weight:700; color:var(--text-muted)">Karşılaştırma Dönemi (MoM)</label>
            <select id="finComparePeriod" class="form-control" style="width:150px">
              <option value="">Karşılaştırma Yapma</option>
            </select>
          </div>
          <div style="display:flex; flex-direction:column; gap:4px">
            <label style="font-size:11px; font-weight:700; color:var(--text-muted)">Fatura Listesinde Ara</label>
            <input type="text" id="finSearch" class="form-control" placeholder="Ad, numara, şirket, masraf kalemi..." style="width:230px;">
          </div>
          <button class="btn btn-primary" style="align-self: flex-end; margin-bottom: 2px" onclick="ReportsPage.load()">Raporu Üret</button>
        </div>
      `;
      
      API.get('/reports/periods').then(periods => {
        const targetSel = document.getElementById('finTargetPeriod');
        const compareSel = document.getElementById('finComparePeriod');
        
        if (!periods || periods.length === 0) {
          targetSel.innerHTML = '<option value="">Fatura Yok</option>';
          return;
        }

        periods.forEach((p, idx) => {
          targetSel.innerHTML += `<option value="${p}" ${idx === 0 ? 'selected' : ''}>${p}</option>`;
          compareSel.innerHTML += `<option value="${p}" ${idx === 1 ? 'selected' : ''}>${p}</option>`;
        });
        
        targetPeriod = targetSel.value;
        comparePeriod = compareSel.value;

        // Canlı aramayı bağla
        const searchInput = document.getElementById('finSearch');
        if (searchInput) {
          searchInput.value = financialFilterText;
          searchInput.addEventListener('input', (e) => {
            financialFilterText = e.target.value;
            renderFinancialTableOnly();
            renderThreeMonthsTableOnly();
          });
        }
      });
    }
  }

  async function load() {
    const container = document.getElementById('reportContainer');
    container.innerHTML = UI.loading();

    if (activeTab === 'lines') {
      await loadLineReports(container);
    } else {
      await loadFinancialReports(container);
    }
  }

  async function loadLineReports(container) {
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

      const allOps = {};
      [...byOperator.m2m, ...byOperator.data, ...byOperator.voice].forEach(r => {
        allOps[r.key] = (allOps[r.key] || 0) + r.count;
      });

      const getStatusCount = (type, status) => {
        const found = byStatus[type].find(s => s.key === status);
        return found ? found.count : 0;
      };

      container.innerHTML = `
        <div class="stat-grid" style="margin-bottom:24px">
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

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px">
          <div class="card">
            <div class="card-header"><span class="card-title">${i18n.t('reports_status_dist') || 'Durum Dağılımı'}</span></div>
            <div class="card-body">
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Durum</th>
                      <th>M2M</th>
                      <th>Data</th>
                      <th>Ses</th>
                      <th>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="badge badge-success">Aktif</span></td>
                      <td>${getStatusCount('m2m', 'active')}</td>
                      <td>${getStatusCount('data', 'active')}</td>
                      <td>${getStatusCount('voice', 'active')}</td>
                      <td style="font-weight:bold">${getStatusCount('m2m', 'active') + getStatusCount('data', 'active') + getStatusCount('voice', 'active')}</td>
                    </tr>
                    <tr>
                      <td><span class="badge badge-warning">Yedek</span></td>
                      <td>${getStatusCount('m2m', 'spare')}</td>
                      <td>${getStatusCount('data', 'spare')}</td>
                      <td>${getStatusCount('voice', 'spare')}</td>
                      <td style="font-weight:bold">${getStatusCount('m2m', 'spare') + getStatusCount('data', 'spare') + getStatusCount('voice', 'spare')}</td>
                    </tr>
                    <tr>
                      <td><span class="badge badge-muted">Pasif</span></td>
                      <td>${getStatusCount('m2m', 'passive')}</td>
                      <td>${getStatusCount('data', 'passive')}</td>
                      <td>${getStatusCount('voice', 'passive')}</td>
                      <td style="font-weight:bold">${getStatusCount('m2m', 'passive') + getStatusCount('data', 'passive') + getStatusCount('voice', 'passive')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">📦 Paket Dağılımı (Top 10)</span></div>
            <div class="card-body">
              <div class="table-container">
                <table>
                  <thead><tr><th>Paket Adı</th><th>Operatör</th><th>Hat Sayısı</th></tr></thead>
                  <tbody>
                    ${(summary.byPackage || []).length ? (summary.byPackage || []).slice(0, 10).map(p => `
                    <tr>
                      <td><span style="font-size:12px; font-weight:600">${p.package_name}</span></td>
                      <td>${UI.operatorBadge(p.operator_name)}</td>
                      <td><span class="badge badge-info">${p.count} hat</span></td>
                    </tr>`).join('') : `<tr><td colspan="3">${UI.emptyState('📦', 'Veri yok')}</td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:24px">
          <div class="card">
            <div class="card-header"><span class="card-title">🚗 M2M — Plaka Bazlı Liste (${lists.m2m.length})</span></div>
            <div class="table-container">
              <table>
                <thead><tr><th>Plaka</th><th>Araç Tipi</th><th>Telefon No</th><th>Operatör</th><th>Paket</th><th>Durum</th></tr></thead>
                <tbody>
                  ${lists.m2m.length ? lists.m2m.map(r => `
                  <tr>
                    <td><strong>${r.plate_no || '—'}</strong></td>
                    <td>${r.vehicle_type || '—'}</td>
                    <td>${r.phone_no || '—'}</td>
                    <td>${UI.operatorBadge(r.operator)}</td>
                    <td style="font-size:11px">${r.package_name || '—'}</td>
                    <td>${UI.statusBadge(r.status)}</td>
                  </tr>`).join('') : `<tr><td colspan="6">${UI.emptyState('🚗', 'M2M kaydı yok')}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">🌐 Data — Lokasyon Bazlı Liste (${lists.data.length})</span></div>
            <div class="table-container">
              <table>
                <thead><tr><th>Lokasyon</th><th>Telefon No</th><th>Operatör</th><th>Paket</th><th>Durum</th></tr></thead>
                <tbody>
                  ${lists.data.length ? lists.data.map(r => `
                  <tr>
                    <td><strong>${r.location || '—'}</strong></td>
                    <td>${r.phone_no || '—'}</td>
                    <td>${UI.operatorBadge(r.operator)}</td>
                    <td style="font-size:11px">${r.package_name || '—'}</td>
                    <td>${UI.statusBadge(r.status)}</td>
                  </tr>`).join('') : `<tr><td colspan="5">${UI.emptyState('🌐', 'Data kaydı yok')}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">📞 Ses — Personel Bazlı Liste (${lists.voice.length})</span></div>
            <div class="table-container">
              <table>
                <thead><tr><th>Personel</th><th>Departman</th><th>Şirket</th><th>Telefon No</th><th>Operatör</th><th>Durum</th></tr></thead>
                <tbody>
                  ${lists.voice.length ? lists.voice.map(r => `
                  <tr>
                    <td><strong>${r.assigned_to || '—'}</strong></td>
                    <td class="td-muted" style="font-size:12px">${r.department || '—'}</td>
                    <td class="td-muted" style="font-size:12px">${r.assigned_company || '—'}</td>
                    <td>${r.phone_no || '—'}</td>
                    <td>${UI.operatorBadge(r.operator)}</td>
                    <td>${UI.statusBadge(r.status)}</td>
                  </tr>`).join('') : `<tr><td colspan="6">${UI.emptyState('📞', 'Ses kaydı yok')}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="card"><div class="card-body" style="color:var(--danger)">Hata: ${err.message}</div></div>`;
    }
  }

  async function loadFinancialReports(container) {
    targetPeriod = document.getElementById('finTargetPeriod')?.value || '';
    comparePeriod = document.getElementById('finComparePeriod')?.value || '';

    if (!targetPeriod) {
      container.innerHTML = `<div class="card"><div class="card-body">${UI.emptyState('💼', 'Önce Dönem Seçiniz', 'Mali analiz raporu oluşturmak için hedef fatura periyodu seçin.')}</div></div>`;
      return;
    }

    try {
      const resp = await API.post('/reports/financial', { period: targetPeriod, comparePeriod });
      financialData = resp;

      const { targetStats, compareStats, invoicesList, comparisonList, lineOwnership, threeMonthsReport } = resp;

      // İstatistikleri hesapla
      const totalAmount = targetStats.total_payable || 0;
      const amountDiff = compareStats ? (totalAmount - (compareStats.total_payable || 0)) : 0;
      const pctDiff = (compareStats && compareStats.total_payable > 0) ? (amountDiff / compareStats.total_payable) * 100 : 0;
      
      const phoneCount = targetStats.phone_count || 0;
      const avgCostPerLine = phoneCount > 0 ? (totalAmount / phoneCount) : 0;

      let activeCount = 0;
      let totalLinesCount = 0;
      lineOwnership.forEach(o => {
        totalLinesCount += o.count;
        if (o.status === 'active') activeCount += o.count;
      });

      // MoM bütçe kaçaklarını hesapla
      let topIncreases = [];
      if (comparePeriod && comparisonList.length > 0) {
        topIncreases = comparisonList
          .map(c => ({
            holder: c.holder,
            phone_no: c.phone_no,
            operator: c.operator,
            diff: c.target_amount - c.compare_amount,
            pct: c.compare_amount > 0 ? ((c.target_amount - c.compare_amount) / c.compare_amount) * 100 : 100,
            target_amount: c.target_amount,
            compare_amount: c.compare_amount
          }))
          .filter(c => c.diff > 10)
          .sort((a, b) => b.diff - a.diff)
          .slice(0, 5);
      }

      // Üst kartlar HTML'i
      let statsHtml = `
        <div class="stat-grid" style="margin-bottom:24px">
          <div class="stat-card">
            <div class="stat-label">Toplam Maliyet</div>
            <div class="stat-value" style="color:var(--accent)">${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
            <div class="stat-sub">
              ${comparePeriod ? `
                <span class="metric-comparison ${amountDiff >= 0 ? 'up' : 'down'}">
                  ${amountDiff >= 0 ? '🔺 +' : '🔻 '}
                  ${amountDiff.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                  (${pctDiff.toFixed(1)}% vs ${comparePeriod})
                </span>
              ` : `Hedef Dönem: ${targetPeriod}`}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Faturalandırılan Hat</div>
            <div class="stat-value">${phoneCount} adet</div>
            <div class="stat-sub">Ort. Hat Maliyeti: <strong>${avgCostPerLine.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</strong></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Sistemde Kayıtlı Hatlar</div>
            <div class="stat-value">${activeCount} / ${totalLinesCount}</div>
            <div class="stat-sub">Aktif / Toplam Hat sayısı</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Fatura Matrahı (Net)</div>
            <div class="stat-value">${(targetStats.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</div>
            <div class="stat-sub">KDV+ÖİV Vergiler: <strong>${((targetStats.kdv || 0) + (targetStats.oiv || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</strong></div>
          </div>
        </div>
      `;

      // Arayüz yapısı
      container.innerHTML = `
        ${statsHtml}
        
        <div class="financial-grid" style="margin-bottom:20px">
          <!-- Kime Ne Kadar Fatura Gelmiş? -->
          <div class="card">
            <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
              <span class="card-title">💵 Fatura Dağılımı ve Maliyet Kırılımları</span>
            </div>
            <div class="table-container">
              <table style="width: 100%;">
                <thead>
                  <tr>
                    <th id="th_holder" class="sortable-header" onclick="ReportsPage.sortFinancial('holder')" style="width: 20%">Kişi / Araç / Plaka</th>
                    <th id="th_phone_no" class="sortable-header" onclick="ReportsPage.sortFinancial('phone_no')">Telefon No</th>
                    <th id="th_operator" class="sortable-header" onclick="ReportsPage.sortFinancial('operator')">Operatör</th>
                    <th id="th_cost_center" class="sortable-header" onclick="ReportsPage.sortFinancial('cost_center')">Masraf Kalemi</th>
                    <th id="th_company_name" class="sortable-header" onclick="ReportsPage.sortFinancial('company_name')">Şirket</th>
                    <th id="th_line_count" class="sortable-header" onclick="ReportsPage.sortFinancial('line_count')" style="text-align:center; width: 10%">Zimmetli Hat</th>
                    <th id="th_total_payable" class="sortable-header" onclick="ReportsPage.sortFinancial('total_payable')" style="text-align:right; width: 15%">Tutar (TL)</th>
                    <th id="th_is_matched" class="sortable-header" onclick="ReportsPage.sortFinancial('is_matched')" style="text-align:center">Eşleşme</th>
                  </tr>
                </thead>
                <tbody id="financialTableBody">
                  <!-- JavaScript ile dinamik render edilecek -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Kimde Kaç Hat Var ve Ekstra Analizler -->
          <div style="display:flex; flex-direction:column; gap:20px;">
            <!-- Hat Sahipliği Dağılımı -->
            <div class="card">
              <div class="card-header"><span class="card-title">👥 Kimde Kaç Hat Var?</span></div>
              <div class="card-body">
                <div class="table-container">
                  <table style="width: 100%">
                    <thead>
                      <tr>
                        <th id="th_own_holder" class="sortable-header" onclick="ReportsPage.sortOwnership('holder')">Kişi / Plaka / Lokasyon</th>
                        <th>Hat Dağılımı</th>
                        <th id="th_own_total" class="sortable-header" onclick="ReportsPage.sortOwnership('total')" style="text-align:right">Toplam</th>
                      </tr>
                    </thead>
                    <tbody id="ownershipTableBody">
                      <!-- JavaScript ile dinamik render edilecek -->
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- MoM Bütçe Kaçakları (Tam Genişlikte) -->
        ${comparePeriod ? `
          <div class="card" style="margin-top:20px; border: 1px solid var(--danger-light); background: #fffcfc; width: 100%;">
            <div class="card-header" style="background:#feebe9; border-bottom: 1px solid var(--danger-light);">
              <span class="card-title" style="color:var(--danger); display:flex; align-items:center; gap:8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                En Çok Maliyet Artışı Gösteren Hatlar
              </span>
            </div>
            <div class="card-body">
              ${topIncreases.length ? `
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:20px;">
                  ${topIncreases.map(inc => `
                    <div style="display:flex; flex-direction:column; gap:8px; border:1px solid #fce8e6; border-radius:10px; padding:16px; background:#fff; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.05); transition: transform 0.2s;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                          <div style="font-weight:700; color:var(--text-primary); font-size:15px; margin-bottom:4px;">${inc.holder}</div>
                          <div style="font-size:12px; color:var(--text-muted)">${inc.phone_no}</div>
                        </div>
                        <div>${UI.operatorBadge(inc.operator)}</div>
                      </div>
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:12px; border-top:1px dashed #fce8e6">
                        <span style="font-weight:800; color:var(--danger); font-size:16px;">+${inc.diff.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                        <span style="font-size:12px; font-weight:700; color:#fff; background:var(--danger); padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:4px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                          ${inc.pct.toFixed(0)}% Artış
                        </span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `<div style="text-align:center; padding:24px; color:var(--success); font-weight:600; font-size:15px;">Önemli bir bütçe artışı tespit edilmedi. 🎉</div>`}
            </div>
          </div>
        ` : ''}
        </div>

        <!-- Son 3 Dönem Karşılaştırmalı Fatura Tablosu -->
        <div class="card" style="margin-top:20px; width: 100%;">
          <div class="card-header">
            <span class="card-title">📊 Son 3 Dönem Karşılaştırmalı Fatura Analizi</span>
          </div>
          <div class="table-container">
            <table style="width: 100%">
              <thead>
                <tr>
                  <th data-col-key="holder">Kişi / Araç / Plaka</th>
                  <th data-col-key="phone_no">Telefon No</th>
                  <th data-col-key="cost_center">Masraf Kalemi</th>
                  <th data-col-key="company_name">Şirket</th>
                  <th data-col-key="line_count" style="text-align:center; width: 10%">Zimmetli Hat</th>
                  <th data-col-key="amount_p3" style="text-align:right; width: 12%">${threeMonthsReport.periods[2] || 'Dönem 3'}</th>
                  <th data-col-key="amount_p2" style="text-align:right; width: 12%">${threeMonthsReport.periods[1] || 'Dönem 2'}</th>
                  <th data-col-key="amount_p1" style="text-align:right; width: 12%">${threeMonthsReport.periods[0] || 'Dönem 1'}</th>
                  <th data-col-key="pct_change" style="text-align:right; width: 10%">Değişim (%)</th>
                </tr>
              </thead>
              <tbody id="threeMonthsTableBody">
                <!-- Dinamik çizilecek -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Tablo gövdelerini ilklendir
      renderFinancialTableOnly();
      renderOwnershipTableOnly();
      renderThreeMonthsTableOnly();

      // Canlı arama dinleyicisi
      const searchInput = document.getElementById('finSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          financialFilterText = e.target.value;
          renderFinancialTableOnly();
          renderOwnershipTableOnly();
          renderThreeMonthsTableOnly();
        });
      }

    } catch (err) {
      container.innerHTML = `<div class="card"><div class="card-body" style="color:var(--danger)">Hata: ${err.message}</div></div>`;
    }
  }

  function renderFinancialTableOnly() {
    const tbody = document.getElementById('financialTableBody');
    if (!tbody || !financialData) return;

    let list = [...financialData.invoicesList];

    // Hat sayılarını eşleştirmek için bellek içi harita (Büyük/küçük harf duyarsız)
    const holdersLineCounts = buildHoldersLineCounts(financialData.lineOwnership);

    const colDefs = {
      'holder': { label: 'Kişi / Araç / Plaka', getVal: r => r.holder || '—' },
      'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
      'operator': { label: 'Operatör', getVal: r => r.operator || '—' },
      'cost_center': { label: 'Masraf Kalemi', getVal: r => r.cost_center || '—' },
      'company_name': { label: 'Şirket', getVal: r => r.company_name || '—' },
      'line_count': { label: 'Zimmetli Hat', getVal: r => holdersLineCounts[normalizeName(r.holder)] || 0 },
      'total_payable': { label: 'Tutar (TL)', getVal: r => r.total_payable || 0 },
      'is_matched': { label: 'Eşleşme', getVal: r => r.is_matched ? 'Eşleşti' : 'Eşleşmedi' }
    };

    // 1. Canlı arama filtresi (global search bar)
    if (financialFilterText) {
      const q = financialFilterText.toLowerCase().trim();
      list = list.filter(item => 
        (item.holder && item.holder.toLowerCase().includes(q)) ||
        (item.phone_no && item.phone_no.toLowerCase().includes(q)) ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.cost_center && item.cost_center.toLowerCase().includes(q)) ||
        (item.operator && item.operator.toLowerCase().includes(q))
      );
    }

    // Initialize colFilters if not exist
    if (!financialColFilters) financialColFilters = {};

    const unfilteredRows = list;

    // Apply Excel-like filters and sorting
    list = UI.filterRows(list, financialColFilters, colDefs);
    list = UI.sortRows(list, financialColFilters._sort, colDefs);

    // 3. Tablo satırlarını çiz
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">${UI.emptyState('🔍', 'Kriterlere uygun fatura bulunamadı.')}</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const lineCount = holdersLineCounts[normalizeName(item.holder)] || 0;
      return `
        <tr>
          <td><strong>${item.holder}</strong></td>
          <td style="font-size:12px">${item.phone_no || '—'}</td>
          <td>${UI.operatorBadge(item.operator)}</td>
          <td style="font-size:12px; font-weight: 500">${item.cost_center || '—'}</td>
          <td class="td-muted" style="font-size:12px">${item.company_name || '—'}</td>
          <td style="text-align:center; font-weight: 600">
            <span style="font-size:11px; padding:2px 6px; background:var(--accent-light); color:var(--accent); border-radius:4px">${lineCount} Hat</span>
            <div style="margin-top:4px;">
              <span style="font-size:9px; padding:2px 6px; border-radius:4px; ${
                item.line_type === 'Ses' ? 'background:var(--accent-light); color:var(--accent);' :
                item.line_type === 'M2M' ? 'background:#fef7e0; color:#b06000;' :
                item.line_type === 'Data' ? 'background:#e6f4ea; color:#137333;' :
                'background:#f1f3f4; color:#5f6368;'
              }">${item.line_type || 'Bilinmiyor'}</span>
            </div>
          </td>
          <td style="text-align:right; font-weight:700">${item.total_payable.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</td>
          <td style="text-align:center">
            ${item.is_matched 
              ? '<span class="badge badge-success" title="Sistemdeki SIM kart/personel ile eşleşti">Eşleşti</span>' 
              : '<span class="badge badge-danger" title="Sistemde kayıtlı bir hat bulunamadı!">Eşleşmedi</span>'}
          </td>
        </tr>
      `;
    }).join('');

    // Setup setupTableFilters
    UI.setupTableFilters('financialTableBody', unfilteredRows, financialColFilters, colDefs, () => {
      renderFinancialTableOnly();
    });
  }

  function renderOwnershipTableOnly() {
    const tbody = document.getElementById('ownershipTableBody');
    if (!tbody || !financialData) return;

    const holders = {};
    financialData.lineOwnership.forEach(o => {
      if (!holders[o.holder]) {
        holders[o.holder] = { voice: 0, m2m: 0, data: 0, total: 0 };
      }
      holders[o.holder][o.type] += o.count;
      holders[o.holder].total += o.count;
    });

    let list = Object.entries(holders).map(([holder, counts]) => ({
      holder,
      ...counts
    }));

    const colDefs = {
      'holder': { label: 'Kişi / Plaka / Lokasyon', getVal: r => r.holder || '—' },
      'total': { label: 'Toplam', getVal: r => r.total || 0 }
    };

    // 1. Canlı Arama Filtrele
    if (financialFilterText) {
      const q = financialFilterText.toLowerCase().trim();
      list = list.filter(item => 
        item.holder.toLowerCase().includes(q)
      );
    }

    if (!ownershipColFilters) ownershipColFilters = {};

    const unfilteredRows = list;

    // Apply Excel-like filters and sorting
    list = UI.filterRows(list, ownershipColFilters, colDefs);
    list = UI.sortRows(list, ownershipColFilters._sort, colDefs);

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">${UI.emptyState('👥', 'Eşleşen zimmet bulunamadı.')}</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const badgHtml = [];
      if (item.voice > 0) badgHtml.push(`<span style="font-size:10px; padding:2px 6px; background:var(--accent-light); color:var(--accent); border-radius:4px; margin-right:2px">${item.voice} Ses</span>`);
      if (item.m2m > 0) badgHtml.push(`<span style="font-size:10px; padding:2px 6px; background:#fef7e0; color:#b06000; border-radius:4px; margin-right:2px">${item.m2m} M2M</span>`);
      if (item.data > 0) badgHtml.push(`<span style="font-size:10px; padding:2px 6px; background:#e6f4ea; color:#137333; border-radius:4px; margin-right:2px">${item.data} Data</span>`);
      
      return `
        <tr>
          <td><strong>${item.holder}</strong></td>
          <td>${badgHtml.join('')}</td>
          <td style="text-align:right; font-weight:700">${item.total} Hat</td>
        </tr>
      `;
    }).join('');

    UI.setupTableFilters('ownershipTableBody', unfilteredRows, ownershipColFilters, colDefs, () => {
      renderOwnershipTableOnly();
    });
  }

  function renderThreeMonthsTableOnly() {
    const tbody = document.getElementById('threeMonthsTableBody');
    if (!tbody || !financialData || !financialData.threeMonthsReport) return;

    let list = [...financialData.threeMonthsReport.list];

    // Hat sayılarını eşleştirmek için bellek içi harita (Büyük/küçük harf duyarsız)
    const holdersLineCounts = buildHoldersLineCounts(financialData.lineOwnership);

    // Canlı filtrele
    if (financialFilterText) {
      const q = financialFilterText.toLowerCase().trim();
      list = list.filter(item => 
        (item.holder && item.holder.toLowerCase().includes(q)) ||
        (item.phone_no && item.phone_no.toLowerCase().includes(q)) ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.cost_center && item.cost_center.toLowerCase().includes(q))
      );
    }

    const colDefs = {
      'holder': { label: 'Kişi / Araç / Plaka', getVal: r => r.holder || '—' },
      'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
      'cost_center': { label: 'Masraf Kalemi', getVal: r => r.cost_center || '—' },
      'company_name': { label: 'Şirket', getVal: r => r.company_name || '—' },
      'line_count': { label: 'Zimmetli Hat', getVal: r => holdersLineCounts[normalizeName(r.holder)] || 0 },
      'amount_p3': { label: financialData.threeMonthsReport.periods[2] || 'Dönem 3', getVal: r => r.amount_p3 || 0 },
      'amount_p2': { label: financialData.threeMonthsReport.periods[1] || 'Dönem 2', getVal: r => r.amount_p2 || 0 },
      'amount_p1': { label: financialData.threeMonthsReport.periods[0] || 'Dönem 1', getVal: r => r.amount_p1 || 0 },
      'pct_change': { label: 'Değişim (%)', getVal: r => r.amount_p2 > 0 ? ((r.amount_p1 - r.amount_p2) / r.amount_p2) * 100 : 0, filterable: false }
    };

    if (!threeMonthsColFilters) threeMonthsColFilters = {};

    const unfilteredRows = list;

    // Excel tarzı filtre ve sıralama uygula
    list = UI.filterRows(list, threeMonthsColFilters, colDefs);
    list = UI.sortRows(list, threeMonthsColFilters._sort, colDefs);

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center">${UI.emptyState('🔍', 'Kriterlere uygun karşılaştırmalı fatura bulunamadı.')}</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      // Değişim hesabı: amount_p2 (Önceki Ay) -> amount_p1 (Hedef Ay)
      let pctChangeHtml = '—';
      if (item.amount_p2 > 0) {
        const diff = item.amount_p1 - item.amount_p2;
        const pct = (diff / item.amount_p2) * 100;
        if (pct > 0.5) {
          pctChangeHtml = `<span style="color:var(--danger); font-weight:600">🔺 +${pct.toFixed(0)}%</span>`;
        } else if (pct < -0.5) {
          pctChangeHtml = `<span style="color:var(--success); font-weight:600">🔻 ${pct.toFixed(0)}%</span>`;
        } else {
          pctChangeHtml = `<span style="color:var(--text-muted)">0%</span>`;
        }
      }

      const lineCount = holdersLineCounts[normalizeName(item.holder)] || 0;

      return `
        <tr>
          <td><strong>${item.holder}</strong></td>
          <td style="font-size:12px">${item.phone_no || '—'}</td>
          <td style="font-size:12px">${item.cost_center || '—'}</td>
          <td class="td-muted" style="font-size:12px">${item.company_name || '—'}</td>
          <td style="text-align:center; font-weight: 600"><span style="font-size:11px; padding:2px 6px; background:var(--accent-light); color:var(--accent); border-radius:4px">${lineCount} Hat</span></td>
          <td style="text-align:right">${item.amount_p3 ? item.amount_p3.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ₺' : '—'}</td>
          <td style="text-align:right">${item.amount_p2 ? item.amount_p2.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ₺' : '—'}</td>
          <td style="text-align:right; font-weight:700">${item.amount_p1 ? item.amount_p1.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ₺' : '0.0 ₺'}</td>
          <td style="text-align:right">${pctChangeHtml}</td>
        </tr>
      `;
    }).join('');

    UI.setupTableFilters('threeMonthsTableBody', unfilteredRows, threeMonthsColFilters, colDefs, () => {
      renderThreeMonthsTableOnly();
    });
  }

  function exportExcel() {
    if (activeTab === 'lines') {
      exportLinesExcel();
    } else {
      exportFinancialExcel();
    }
  }

  function exportPDF() {
    if (activeTab === 'lines') {
      exportLinesPDF();
    } else {
      exportFinancialPDF();
    }
  }

  function exportLinesPDF() {
    if (!currentData) return UI.toast('Dışa aktarılacak veri yok.', 'error');
    const { summary, lists } = currentData;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Hat Dağılım Raporu</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; padding: 30px; line-height: 1.4; }
            h1 { font-size: 22px; border-bottom: 2px solid #1a73e8; padding-bottom: 8px; color: #1a73e8; margin-bottom: 5px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
            .summary-box { display: flex; gap: 15px; margin-bottom: 30px; }
            .card { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f8f9fa; }
            .card-label { font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; }
            .card-value { font-size: 24px; font-weight: bold; margin-top: 5px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
            th { background: #f1f3f4; font-weight: bold; color: #333; }
            .print-btn { padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:center;" class="no-print">
            <span style="font-size:12px; color:#666;">Yazıcı çıktısı / PDF olarak kaydetmek için sağdaki butona tıklayın.</span>
            <button class="print-btn" onclick="window.print()">Yazdır / PDF Kaydet</button>
          </div>
          <h1>📡 SIM Kart Takip Sistemi - Hat Dağılım Raporu</h1>
          <div class="meta">Oluşturma Tarihi: ${new Date().toLocaleString()}</div>
          
          <div class="summary-box">
            <div class="card"><div class="card-label">Toplam Hat</div><div class="card-value">${summary.totals.all}</div></div>
            <div class="card"><div class="card-label">M2M Hatları</div><div class="card-value">${summary.totals.m2m}</div></div>
            <div class="card"><div class="card-label">Data Hatları</div><div class="card-value">${summary.totals.data}</div></div>
            <div class="card"><div class="card-label">Ses Hatları</div><div class="card-value">${summary.totals.voice}</div></div>
          </div>
          
          <h2>📞 Detaylı Hat Dağılım Listesi</h2>
          <table>
            <thead>
              <tr>
                <th>Tür</th>
                <th>Kişi / Plaka / Lokasyon</th>
                <th>Telefon No</th>
                <th>Operatör</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              ${lists.voice.map(r => `<tr><td>Ses</td><td><strong>${r.assigned_to || '—'}</strong></td><td>${r.phone_no || '—'}</td><td>${r.operator || '—'}</td><td>${r.status}</td></tr>`).join('')}
              ${lists.m2m.map(r => `<tr><td>M2M</td><td><strong>${r.plate_no || '—'}</strong></td><td>${r.phone_no || '—'}</td><td>${r.operator || '—'}</td><td>${r.status}</td></tr>`).join('')}
              ${lists.data.map(r => `<tr><td>Data</td><td><strong>${r.location || '—'}</strong></td><td>${r.phone_no || '—'}</td><td>${r.operator || '—'}</td><td>${r.status}</td></tr>`).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function exportFinancialPDF() {
    if (!financialData) return UI.toast('Dışa aktarılacak mali veri yok.', 'error');
    const { targetStats, compareStats, invoicesList, lineOwnership } = financialData;
    const printWindow = window.open('', '_blank');

    // Bellekte hat sahipliklerini eşleştir (Büyük/küçük harf duyarsız)
    const holdersLineCounts = buildHoldersLineCounts(lineOwnership);

    let list = [...invoicesList];

    const colDefs = {
      'holder': { label: 'Kişi / Araç / Plaka', getVal: r => r.holder || '—' },
      'phone_no': { label: 'Telefon No', getVal: r => r.phone_no || '—' },
      'operator': { label: 'Operatör', getVal: r => r.operator || '—' },
      'cost_center': { label: 'Masraf Kalemi', getVal: r => r.cost_center || '—' },
      'company_name': { label: 'Şirket', getVal: r => r.company_name || '—' },
      'line_count': { label: 'Zimmetli Hat', getVal: r => holdersLineCounts[normalizeName(r.holder)] || 0 },
      'total_payable': { label: 'Tutar (TL)', getVal: r => r.total_payable || 0 },
      'is_matched': { label: 'Eşleşme', getVal: r => r.is_matched ? 'Eşleşti' : 'Eşleşmedi' }
    };

    // 1. Canlı arama filtresi (global search bar)
    if (financialFilterText) {
      const q = financialFilterText.toLowerCase().trim();
      list = list.filter(item => 
        (item.holder && item.holder.toLowerCase().includes(q)) ||
        (item.phone_no && item.phone_no.toLowerCase().includes(q)) ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.cost_center && item.cost_center.toLowerCase().includes(q)) ||
        (item.operator && item.operator.toLowerCase().includes(q))
      );
    }
    
    // Apply Excel-like filters and sorting
    list = UI.filterRows(list, financialColFilters, colDefs);
    list = UI.sortRows(list, financialColFilters._sort, colDefs);

    const totalAmount = targetStats.total_payable || 0;
    const amountDiff = compareStats ? (totalAmount - (compareStats.total_payable || 0)) : 0;
    const pctDiff = (compareStats && compareStats.total_payable > 0) ? (amountDiff / compareStats.total_payable) * 100 : 0;

    printWindow.document.write(`
      <html>
        <head>
          <title>Finansal Rapor - ${targetPeriod}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #333; padding: 30px; line-height: 1.4; }
            h1 { font-size: 22px; border-bottom: 2px solid #1a73e8; padding-bottom: 8px; color: #1a73e8; margin-bottom: 5px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
            .summary-box { display: flex; gap: 15px; margin-bottom: 30px; }
            .card { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: #f8f9fa; }
            .card-label { font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; }
            .card-value { font-size: 22px; font-weight: bold; margin-top: 5px; color: #111; }
            .card-sub { font-size: 11px; margin-top: 4px; font-weight: 600; }
            .card-sub.up { color: #d93025; }
            .card-sub.down { color: #188038; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; margin-bottom: 30px; }
            th, td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
            th { background: #f1f3f4; font-weight: bold; color: #333; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
            .badge-success { background: #e6f4ea; color: #137333; }
            .badge-danger { background: #feebe9; color: #c5221f; }
            .print-btn { padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; }
            @media print {
              .no-print { display: none !important; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div style="display:flex; justify-content:space-between; align-items:center;" class="no-print">
            <span style="font-size:12px; color:#666;">Yazıcı çıktısı / PDF olarak kaydetmek için sağdaki butona tıklayın.</span>
            <button class="print-btn" onclick="window.print()">Yazdır / PDF Kaydet</button>
          </div>
          <h1>📡 SIM Kart Takip Sistemi - Finansal & Mali Analiz Raporu</h1>
          <div class="meta">
            Rapor Dönemi: <strong>${targetPeriod}</strong> 
            ${comparePeriod ? ` | Karşılaştırma Dönemi: <strong>${comparePeriod}</strong>` : ''} 
            | Oluşturma Tarihi: ${new Date().toLocaleString()}
          </div>

          <div class="summary-box">
            <div class="card">
              <div class="card-label">Toplam Maliyet</div>
              <div class="card-value">${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
              ${comparePeriod ? `
                <div class="card-sub ${amountDiff >= 0 ? 'up' : 'down'}">
                  ${amountDiff >= 0 ? '🔺 +' : '🔻 '}
                  ${amountDiff.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ (${pctDiff.toFixed(1)}%)
                </div>
              ` : ''}
            </div>
            <div class="card">
              <div class="card-label">Faturalandırılan Hat</div>
              <div class="card-value">${targetStats.phone_count || 0} adet</div>
              <div class="card-sub" style="color:#555">Ort: ${(targetStats.phone_count > 0 ? (totalAmount / targetStats.phone_count) : 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ / hat</div>
            </div>
            <div class="card">
              <div class="card-label">Net Matrah</div>
              <div class="card-value">${(targetStats.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
              <div class="card-sub" style="color:#555">Vergiler: ${((targetStats.kdv || 0) + (targetStats.oiv || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</div>
            </div>
          </div>

          <h2>💵 Detaylı Fatura Dağılımı</h2>
          <table>
            <thead>
              <tr>
                <th>Kişi / Cihaz / Plaka</th>
                <th>Telefon No</th>
                <th>Operatör</th>
                <th>Şirket / Departman</th>
                <th class="text-center" style="width: 10%">Zimmetli Hat</th>
                <th class="text-right">Tutar</th>
                <th>Eşleşme</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(item => {
                const lineCount = holdersLineCounts[normalizeName(item.holder)] || 0;
                return `
                  <tr>
                    <td><strong>${item.holder}</strong></td>
                    <td>${item.phone_no || '—'}</td>
                    <td>${item.operator || '—'}</td>
                    <td>${item.company_name || item.cost_center || '—'}</td>
                    <td class="text-center" style="font-weight:bold">
                      ${lineCount} Hat<br>
                      <div style="margin-top:3px;">
                        <span style="display:inline-block; font-size:9px; padding:2px 6px; border-radius:4px; font-weight:normal; ${
                          item.line_type === 'Ses' ? 'background:#e8f0fe; color:#1a73e8;' :
                          item.line_type === 'M2M' ? 'background:#fef7e0; color:#b06000;' :
                          item.line_type === 'Data' ? 'background:#e6f4ea; color:#137333;' :
                          'background:#f1f3f4; color:#5f6368;'
                        }">${item.line_type || 'Bilinmiyor'}</span>
                      </div>
                    </td>
                    <td class="text-right">${item.total_payable.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                    <td>${item.is_matched ? '<span class="badge badge-success">Eşleşti</span>' : '<span class="badge badge-danger">Eşleşmedi</span>'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function exportLinesExcel() {
    if (!currentData) return UI.toast('Dışa aktarılacak veri yok.', 'error');
    if (typeof XLSX === 'undefined') return UI.toast('Excel kütüphanesi yüklenemedi.', 'error');

    const wb = XLSX.utils.book_new();
    const { lists, summary } = currentData;

    const summaryData = [
      ['Rapor Özeti', ''],
      ['Oluşturma Tarihi', new Date().toLocaleString()],
      ['', ''],
      ['Modül', 'Toplam Hat Sayısı'],
      ['M2M', summary.totals.m2m],
      ['Data', summary.totals.data],
      ['Ses', summary.totals.voice],
      ['GENEL TOPLAM', summary.totals.all]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

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
      XLSX.utils.book_append_sheet(wb, wsM2m, 'M2M Hatları');
    }

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
      XLSX.utils.book_append_sheet(wb, wsData, 'Data Hatları');
    }

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
      XLSX.utils.book_append_sheet(wb, wsVoice, 'Ses Hatları');
    }

    XLSX.writeFile(wb, `SIM_Takip_Raporu_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function exportFinancialExcel() {
    if (!financialData) return UI.toast('Dışa aktarılacak mali veri yok.', 'error');
    if (typeof XLSX === 'undefined') return UI.toast('Excel kütüphanesi yüklenemedi.', 'error');

    const wb = XLSX.utils.book_new();
    const { targetStats, compareStats, invoicesList, lineOwnership, threeMonthsReport } = financialData;

    const summaryData = [
      ['Finansal Rapor Özeti', ''],
      ['Hedef Rapor Dönemi', targetPeriod],
      ['Karşılaştırma Dönemi', comparePeriod || 'Seçilmedi'],
      ['Oluşturma Tarihi', new Date().toLocaleString()],
      ['', ''],
      ['Metrik', 'Değer'],
      ['Hedef Dönem Toplam Tutar', (targetStats.total_payable || 0) + ' ₺'],
      ['Hedef Dönem Net Matrah', (targetStats.amount || 0) + ' ₺'],
      ['Hedef Dönem Toplam KDV', (targetStats.kdv || 0) + ' ₺'],
      ['Hedef Dönem Toplam ÖİV', (targetStats.oiv || 0) + ' ₺'],
      ['Toplam Faturalı Hat Sayısı', targetStats.phone_count || 0]
    ];
    if (compareStats) {
      summaryData.push(
        ['Karşılaştırma Dönemi Toplam Tutar', (compareStats.total_payable || 0) + ' ₺'],
        ['Net Tutar Farkı', ((targetStats.total_payable || 0) - (compareStats.total_payable || 0)) + ' ₺']
      );
    }
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Genel Özet');

    if (invoicesList.length > 0) {
      const invData = invoicesList.map(r => ({
        'Kişi / Araç / Plaka': r.holder || '—',
        'Telefon No': r.phone_no || '',
        'Operatör': r.operator || '',
        'Tarife': r.tariff || '',
        'Masraf Kalemi': r.cost_center || '—',
        'Şirket': r.company_name || '—',
        'Hat Tipi': r.line_type || 'Bilinmiyor',
        'Tutar (TL)': r.total_payable || 0,
        'Sistem Eşleşme Durumu': r.is_matched ? 'Eşleşti' : 'Kayıt Yok'
      }));
      const wsInvoices = XLSX.utils.json_to_sheet(invData);
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Fatura Kırılımları');
    }

    if (threeMonthsReport && threeMonthsReport.list.length > 0) {
      const t3Data = threeMonthsReport.list.map(r => {
        const row = {
          'Kişi / Araç / Plaka': r.holder || '—',
          'Telefon No': r.phone_no || '',
          'Operatör': r.operator || '',
          'Masraf Kalemi': r.cost_center || '—',
          'Şirket': r.company_name || '—'
        };
        row[threeMonthsReport.periods[2] || 'Dönem 3'] = r.amount_p3 || 0;
        row[threeMonthsReport.periods[1] || 'Dönem 2'] = r.amount_p2 || 0;
        row[threeMonthsReport.periods[0] || 'Dönem 1'] = r.amount_p1 || 0;
        return row;
      });
      const wsT3 = XLSX.utils.json_to_sheet(t3Data);
      XLSX.utils.book_append_sheet(wb, wsT3, 'Son 3 Dönem Karşılaştırması');
    }

    if (lineOwnership.length > 0) {
      const ownData = lineOwnership.map(r => ({
        'Sahiplenen': r.holder || 'Atanmamış',
        'Hat Tipi': r.type === 'voice' ? 'Ses (Personel)' : (r.type === 'm2m' ? 'M2M (Araç)' : 'Data (Lokasyon)'),
        'Hat Durumu': r.status === 'active' ? 'Aktif' : (r.status === 'spare' ? 'Yedek' : 'Pasif'),
        'Hat Sayısı': r.count
      }));
      const wsOwn = XLSX.utils.json_to_sheet(ownData);
      XLSX.utils.book_append_sheet(wb, wsOwn, 'Hat Sahiplik Dağılımı');
    }

    XLSX.writeFile(wb, `Finansal_Rapor_${targetPeriod}_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return { render, load, exportExcel, exportPDF, switchTab };
})();
