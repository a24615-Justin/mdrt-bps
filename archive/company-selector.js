// ─── Company Selector Module ─────────────────────────────────────────────────
// 依賴：companies.js（COMPANY_DB — v3.0 已合併 GONGSHENG_COMPARE）
// 依賴：原 index.html 中的 CID, g(), recalc(), ID_CONFIG
// 載入順序：companies.js → company-selector.css → company-selector.js（在原 <script> 之後）

(function() {
  'use strict';

  let selectedCompanyId = 'cathay-life'; // 預設選擇國泰

  // ─── ID_CONFIG 到 COMPANY_DB persona key 的映射 ─────────────────────────────
  const PERSONA_MAP = {
    insurance: 'insurance',
    banker:    'banker',
    manager:   'manager',
    medical:   'medical',
    newbie:    'newbie',
  };

  // ─── 原 index.html 的 input ID 對照表 ──────────────────────────────────────
  // 選擇公司後，自動填入這些欄位
  const FIELD_MAP = {
    insurance: {
      commRate:     'i_rate_trad',
      renewalDecay: 'i_ry_decay',
    },
    banker: {
      bankComm:    'b_rate_trad',
      fixedSalary: 'b_salary',
    },
    manager: {
      personalComm:    'm_rate_trad',
      orgAllowance:    'm_org_bonus',
      personalRenewal: 'm_ry_sunk',
    },
    medical: {
      currentComm: 'md_rate_trad',
    },
    newbie: {
      altComm: 'n_rate_trad',
    },
  };

  // ─── 注入 HTML ──────────────────────────────────────────────────────────────
  function injectSelectorHTML() {
    const lifeCompanies = Object.entries(COMPANY_DB)
      .filter(([_, c]) => c.type === 'life')
      .map(([id, c]) => `<button class="cs-chip${id === selectedCompanyId ? ' active' : ''}" data-company="${id}">${c.icon || ''} ${c.short}</button>`)
      .join('');

    const brokerCompanies = Object.entries(COMPANY_DB)
      .filter(([_, c]) => c.type === 'broker')
      .map(([id, c]) => `<button class="cs-chip cs-broker${id === selectedCompanyId ? ' active' : ''}" data-company="${id}">${c.icon || ''} ${c.short}</button>`)
      .join('');

    const customEntry = COMPANY_DB['custom'];
    const customChip = `<button class="cs-chip${selectedCompanyId === 'custom' ? ' active' : ''}" data-company="custom">${customEntry?.icon || '✏️'} 自訂</button>`;

    const html = `
    <div id="company-selector" class="cs-container">
      <div class="cs-header-row">
        <div class="cs-title">📍 對方目前服務公司</div>
        <button id="cs-export-btn" class="cs-export-btn" title="匯出對照表為圖片">📤 匯出</button>
      </div>
      <div id="cs-onboarding" class="cs-onboarding">
        <div class="cs-onboarding-text">👆 選擇對方目前服務的公司，系統會自動帶入預設參數並產生制度對照表</div>
        <button class="cs-onboarding-close" id="cs-onboarding-close">✕</button>
      </div>
      <div class="cs-groups">
        <div class="cs-group">
          <div class="cs-group-label">壽險公司</div>
          <div class="cs-chips">${lifeCompanies}${customChip}</div>
        </div>
        <div class="cs-group">
          <div class="cs-group-label">保經公司（競品對照）</div>
          <div class="cs-chips">${brokerCompanies}</div>
        </div>
      </div>
      <div id="cs-notice" class="cs-notice"></div>
      <div id="cs-comparison" class="cs-comparison"></div>
    </div>`;

    // 插入位置：在身份別按鈕列 (.id-bar) 之後、第一個 panel 之前
    const idBar = document.querySelector('.id-bar');
    const firstPanel = document.getElementById('panel-input');
    if (idBar && firstPanel) {
      firstPanel.parentNode.insertBefore(
        createElementFromHTML(html),
        firstPanel
      );
    } else {
      // Fallback: 插入 body 開頭
      document.body.insertBefore(
        createElementFromHTML(html),
        document.body.firstChild.nextSibling?.nextSibling || document.body.children[2]
      );
    }
  }

  function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
  }

  // ─── HTML sanitize（防 XSS）────────────────────────────────────────────────
  const _esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));

  // ─── 更新通知與對照表 ──────────────────────────────────────────────────────
  function updateNotice() {
    const c = COMPANY_DB[selectedCompanyId];
    if (!c) return;

    const notice = document.getElementById('cs-notice');
    if (!notice) return;

    const persona = PERSONA_MAP[typeof CID !== 'undefined' ? CID : 'insurance'];
    const defs = c.defaults[persona] || c.defaults.insurance || {};
    const commKey = Object.keys(defs)[0] || '';
    const commVal = defs[commKey] || '—';

    const sources = c.dataSources
      ? Object.entries(c.dataSources).map(([k, v]) => `${_esc(k)}: ${_esc(v)}`).join('；')
      : '業界公開資訊估計';

    notice.innerHTML = `
      <div class="cs-notice-main">
        ⚙️ 已套用「<strong>${_esc(c.name)}</strong>」預設參數
        ｜ ${_esc(c.contract)} ｜ ${_esc(c.benefits)}
      </div>
      <div class="cs-notice-warn">
        ⚠️ 數值僅供參考，請依對方實際職階與年資調整
        ${c.note ? `<br>💡 ${_esc(c.note)}` : ''}
        <br>📎 資料來源：${sources}
      </div>`;
    notice.style.display = 'block';
  }

  function updateComparisonTable() {
    const c = COMPANY_DB[selectedCompanyId];
    const gs = COMPANY_DB['gongsheng'];
    const container = document.getElementById('cs-comparison');
    if (!c || !container) return;

    const rows = [
      ['合約制度', _esc(c.contract), _esc(gs.contract)],
      ['產品選擇', _esc(c.comparison.productChoice), _esc(gs.comparison.productChoice)],
      ['收入天花板', _esc(c.comparison.ceiling), _esc(gs.comparison.ceiling)],
      ['勞健保', _esc(c.benefits), _esc(gs.benefits)],
      ['培訓體系', _esc(c.comparison.training), _esc(gs.comparison.training)],
      ['組織發展支援', _esc(c.comparison.orgDev || '—'), _esc(gs.comparison.orgDev)],
      ['品牌特色', _esc(c.comparison.brand || '—'), _esc(gs.comparison.brand)],
    ];

    // 加入佣金率對比（依身份別）+ info tooltip + 10年累積概估
    const persona = PERSONA_MAP[typeof CID !== 'undefined' ? CID : 'insurance'];
    const defs = c.defaults[persona] || c.defaults.insurance || {};
    const commSource = c.dataSources?.commRate || '業界估計中位數';
    const updatedDate = typeof DATA_DISCLAIMER !== 'undefined' ? DATA_DISCLAIMER.lastUpdated : '';

    // 佣金率範圍對照（各公司實際範圍，依 PDF 文件）
    const COMM_RANGES = {
      'cathay-life': '15-55%，依商品',
      'fubon-life': '15-55%，依商品',
      'nanshan-life': '18-50%，依商品（待確認）',
      'shin-kong-life': '15-45%，依商品（待確認）',
      'allianz-life': '10-39%，WL1N 20-39%、TLO 10-20%',
      'taishin-life': '15-55%，NWLB 15-55%、TLA 35-55%',
    };
    const commRange = COMM_RANGES[selectedCompanyId] || '';
    const rangeText = commRange ? `<br>實際範圍：${commRange}` : '';
    const verifyText = c.dataSources?.commRate ? `<br>📋 查證方式：向所屬公司索取最新佣金表核對` : '';

    const tooltipHTML = `<span class="cs-info-icon" tabindex="0">ℹ<span class="cs-tooltip">${c.name} 數據來源：${commSource}${rangeText}<br>更新日期：${updatedDate}${verifyText}</span></span>`;

    const brokerRate = document.getElementById('i_rate_broker')?.value || 50;

    if (defs.commRateTrad != null) {
      const commLabel = persona === 'manager' ? '個人首佣率' : '首年佣金率';
      rows.splice(1, 0, [`簽新保單時的佣金<br><span class="cs-term-hint">（${commLabel}）</span>`, `基礎 ${defs.commRateTrad}% ${tooltipHTML}`, `基礎 ${brokerRate}%`]);
    }

    // 續期佣金率（僅 insurance 身份顯示）
    const insDefs = c.defaults.insurance;
    if (insDefs && persona === 'insurance') {
      const renewalTooltip = `<span class="cs-info-icon" tabindex="0">ℹ<span class="cs-tooltip">續佣率 ${insDefs.renewalRate}%、遞減係數 ${insDefs.renewalDecay}${rangeText}<br>來源：${commSource}${verifyText}</span></span>`;
      rows.splice(2, 0, ['客戶續繳時的佣金<br><span class="cs-term-hint">（續期佣金率）</span>', `${insDefs.renewalRate}% (逐年×${insDefs.renewalDecay}) ${renewalTooltip}`, `5% (逐年×0.85)`]);
    }

    // 10 年累積收入概估（以年繳保費 100 萬計算）
    if (insDefs && persona === 'insurance') {
      const baseFYP = 1000000;
      // 邊界值防護
      const tradComm = Math.max(0, Math.min(1, (Number(insDefs.commRateTrad) || 0) / 100));
      const tradRenewal = Math.max(0, Math.min(1, (Number(insDefs.renewalRate) || 0) / 100));
      const tradDecay = Math.max(0, Math.min(1, Number(insDefs.renewalDecay) || 0));
      const gsComm = Math.max(0, Math.min(1, (Number(brokerRate) || 50) / 100));
      const gsRenewal = 0.05;
      const gsDecay = 0.85;

      let tradTotal = 0, gsTotal = 0;
      for (let y = 1; y <= 10; y++) {
        tradTotal += baseFYP * tradComm;
        gsTotal += baseFYP * gsComm;
        for (let prev = 1; prev < y; prev++) {
          tradTotal += baseFYP * tradRenewal * Math.pow(tradDecay, y - prev - 1);
          gsTotal += baseFYP * gsRenewal * Math.pow(gsDecay, y - prev - 1);
        }
      }
      const tradM = (tradTotal / 10000).toFixed(0);
      const gsM = (gsTotal / 10000).toFixed(0);
      const diffM = ((gsTotal - tradTotal) / 10000).toFixed(0);
      const diffPct = ((gsTotal - tradTotal) / tradTotal * 100).toFixed(0);

      const estTooltip = `<span class="cs-info-icon" tabindex="0">ℹ<span class="cs-tooltip">假設：每年新簽保費 100 萬、無組織津貼<br>含首佣+續佣累積，未扣稅務與費用<br>僅供趨勢參考，非實際承諾</span></span>`;
      rows.splice(3, 0, [
        '10 年累積收入概估<br><span class="cs-term-hint">（年繳保費100萬，簡化模型）</span>',
        `約 ${tradM} 萬 ${estTooltip}`,
        `約 ${gsM} 萬 <span class="cs-diff-highlight">+${diffM}萬 (+${diffPct}%)</span><br><span class="cs-term-hint">詳見下方 5 年推演</span>`
      ]);
    }

    const disclaimerText = typeof DATA_DISCLAIMER !== 'undefined'
      ? DATA_DISCLAIMER.disclaimer
      : '數值僅供參考，實際依各公司最新公告為準。';
    const lastUpdated = typeof DATA_DISCLAIMER !== 'undefined'
      ? DATA_DISCLAIMER.lastUpdated
      : '';

    container.innerHTML = `
      <div class="cs-compare-title">📊 制度對照一覽</div>
      <table class="cs-table">
        <thead>
          <tr>
            <th>比較項目</th>
            <th class="cs-th-trad">🏢 ${c.name}</th>
            <th class="cs-th-broker">🏢 公勝保經</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(([label, trad, broker]) => `
            <tr>
              <td class="cs-label">${label}</td>
              <td class="cs-val-trad">${trad}</td>
              <td class="cs-val-broker">${broker}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="cs-disclaimer-brief">
        ⚠️ 本資料僅供參考，實際佣金因商品、職級、年資有異，請向各公司確認最新制度。
      </div>
      <div style="text-align:center;margin:10px 0 4px;">
        <a href="#panel-result" style="color:#818cf8;font-size:12px;text-decoration:none;">📊 查看完整 5 年財務推演 ↓</a>
      </div>
      <details class="cs-disclaimer-detail">
        <summary>📋 完整免責聲明與資料來源</summary>
        <div class="cs-disclaimer-body">
          ${disclaimerText}${lastUpdated ? `<br>📅 資料更新：${lastUpdated}` : ''}
          ${typeof DATA_DISCLAIMER !== 'undefined' && DATA_DISCLAIMER.primarySources
            ? '<br>📎 來源：' + DATA_DISCLAIMER.primarySources.join('、')
            : ''}
        </div>
      </details>`;
  }

  // ─── 套用預設參數到表單 ────────────────────────────────────────────────────
  function applyDefaults() {
    const c = COMPANY_DB[selectedCompanyId];
    if (!c) return;

    const persona = PERSONA_MAP[typeof CID !== 'undefined' ? CID : 'insurance'];
    const defs = c.defaults[persona];
    if (!defs) return;

    const fieldMap = FIELD_MAP[persona];
    if (!fieldMap) return;

    Object.entries(fieldMap).forEach(([defKey, inputId]) => {
      const val = defs[defKey];
      const el = document.getElementById(inputId);
      if (el && val !== undefined) {
        el.value = val;
        // 觸發 input 事件讓原本的 recalc 生效
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // 同步更新「傳統端」標籤
    const tradLabel = document.getElementById('trad-label');
    if (tradLabel) {
      tradLabel.textContent = c.name;
    }
  }

  // ─── 匯出對照表（複製純文字到剪貼簿）──────────────────────────────────
  function exportComparison() {
    const c = COMPANY_DB[selectedCompanyId];
    const gs = COMPANY_DB['gongsheng'];
    if (!c) return;

    const persona = PERSONA_MAP[typeof CID !== 'undefined' ? CID : 'insurance'];
    const defs = c.defaults[persona] || c.defaults.insurance || {};
    const commRate = defs.commRateTrad ?? '—';
    const brokerRate = document.getElementById('i_rate_broker')?.value || 50;

    // 計算 10 年累積（與對照表同邏輯）
    const insDefs = c.defaults.insurance;
    let estLine = '';
    if (insDefs) {
      const baseFYP = 1000000;
      // 邊界值防護
      const _commR = Math.max(0, Math.min(100, Number(insDefs.commRateTrad) || 0));
      const _renewR = Math.max(0, Math.min(100, Number(insDefs.renewalRate) || 0));
      const _decay = Math.max(0, Math.min(1, Number(insDefs.renewalDecay) || 0));
      const _brRate = Math.max(0, Math.min(100, Number(brokerRate) || 50));
      let tradT = 0, gsT = 0;
      for (let y = 1; y <= 10; y++) {
        tradT += baseFYP * (_commR / 100);
        gsT += baseFYP * (_brRate / 100);
        for (let p = 1; p < y; p++) {
          tradT += baseFYP * (_renewR / 100) * Math.pow(_decay, y - p - 1);
          gsT += baseFYP * 0.05 * Math.pow(0.85, y - p - 1);
        }
      }
      const diffM = ((gsT - tradT) / 10000).toFixed(0);
      estLine = `10年累積差│ 公勝多約 ${diffM} 萬（年繳保費100萬假設）`;
    }

    const lines = [
      '══ MDRT-BPS 制度對照表 ══',
      `對照：${c.name} vs 公勝保經`, '',
      `合約制度　│ ${c.contract} │ ${gs.contract}`,
      `首年佣金率│ 基礎${commRate}%  │ 基礎${brokerRate}%`,
      `續期佣金率│ ${insDefs ? insDefs.renewalRate + '%(逐年×' + insDefs.renewalDecay + ')' : '—'} │ 5%(逐年×0.85)`,
      estLine ? estLine : null,
      `產品選擇　│ ${c.comparison.productChoice} │ ${gs.productChoice}`,
      `收入天花板│ ${c.comparison.ceiling} │ ${gs.ceiling}`,
      `勞健保　　│ ${c.benefits} │ ${gs.benefits}`,
      `培訓體系　│ ${c.comparison.training} │ ${gs.training}`,
      `組織發展　│ ${c.comparison.orgDev || '—'} │ ${gs.orgDev}`,
      `品牌特色　│ ${c.comparison.brand || '—'} │ ${gs.brand}`,
      '',
      `📎 ${c.dataSources ? Object.values(c.dataSources).join('、') : '業界公開資訊'}`,
      `⚠️ 僅供參考，實際佣金因商品、職級、年資有異，請向各公司確認`,
    ].filter(Boolean);
    const text = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showExportFeedback('✅ 已複製！');
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showExportFeedback('✅ 已複製！');
    } catch(e) {
      showExportFeedback('⚠️ 請手動截圖');
    }
    document.body.removeChild(ta);
  }

  function showExportFeedback(msg) {
    const btn = document.getElementById('cs-export-btn');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.textContent = msg;
    btn.classList.add('cs-export-success');
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('cs-export-success');
    }, 2000);
  }

  // ─── 首次使用引導 ──────────────────────────────────────────────────────────
  function initOnboarding() {
    const onboarding = document.getElementById('cs-onboarding');
    const closeBtn = document.getElementById('cs-onboarding-close');
    if (!onboarding) return;

    let seen = false;
    try { seen = localStorage.getItem('cs_onboarding_seen') === '1'; } catch(e) {}

    if (seen) { onboarding.style.display = 'none'; return; }
    onboarding.style.display = 'flex';

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        onboarding.style.display = 'none';
        try { localStorage.setItem('cs_onboarding_seen', '1'); } catch(e) {}
      });
    }

    // 點擊任一 chip 也自動關閉
    document.addEventListener('click', function hideOnChip(e) {
      if (e.target.closest('.cs-chip')) {
        onboarding.style.display = 'none';
        try { localStorage.setItem('cs_onboarding_seen', '1'); } catch(e2) {}
        document.removeEventListener('click', hideOnChip);
      }
    });
  }

  // ─── 事件綁定 ──────────────────────────────────────────────────────────────
  function bindEvents() {
    // Tooltip tap-to-toggle（觸控裝置友善）
    document.addEventListener('click', (e) => {
      const icon = e.target.closest('.cs-info-icon');
      if (icon) {
        e.stopPropagation();
        const wasActive = icon.classList.contains('cs-tooltip-active');
        // 關閉所有其他 tooltip
        document.querySelectorAll('.cs-info-icon.cs-tooltip-active').forEach(el => el.classList.remove('cs-tooltip-active'));
        if (!wasActive) icon.classList.add('cs-tooltip-active');
        return;
      }
      // 點擊其他地方關閉所有 tooltip
      document.querySelectorAll('.cs-info-icon.cs-tooltip-active').forEach(el => el.classList.remove('cs-tooltip-active'));
    });

    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.cs-chip');
      if (!chip) return;

      document.querySelectorAll('.cs-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      selectedCompanyId = chip.dataset.company;
      applyDefaults();
      updateNotice();
      updateComparisonTable();

      if (typeof recalc === 'function') recalc();
    });

    // 監聽身份切換，重新套用
    document.querySelectorAll('.id-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => {
          applyDefaults();
          updateNotice();
          updateComparisonTable();
        }, 50);
      });
    });

    // 匯出按鈕
    const exportBtn = document.getElementById('cs-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportComparison);
  }

  // ─── 初始化 ────────────────────────────────────────────────────────────────
  function init() {
    // 確保 DOM 和原始腳本已載入
    if (typeof COMPANY_DB === 'undefined') {
      console.error('[Company Selector] companies.js 未載入');
      return;
    }
    injectSelectorHTML();
    updateNotice();
    updateComparisonTable();
    bindEvents();
    initOnboarding();
    // 首次套用預設
    applyDefaults();
    if (typeof recalc === 'function') recalc();
    console.log('[Company Selector] ✅ 初始化完成');
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // 延遲確保原始 script 已跑完
    setTimeout(init, 100);
  }

  // 匯出供外部使用
  window.CompanySelector = {
    getSelected: () => COMPANY_DB[selectedCompanyId],
    getSelectedId: () => selectedCompanyId,
    setCompany: (id) => {
      if (COMPANY_DB[id]) {
        selectedCompanyId = id;
        document.querySelectorAll('.cs-chip').forEach(c => {
          c.classList.toggle('active', c.dataset.company === id);
        });
        applyDefaults();
        updateNotice();
        updateComparisonTable();
        if (typeof recalc === 'function') recalc();
      }
    },
  };

})();
