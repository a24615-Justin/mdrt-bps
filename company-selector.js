// ─── Company Selector Module ─────────────────────────────────────────────────
// 依賴：companies.js（COMPANY_DB, GONGSHENG_COMPARE）
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
      ? Object.entries(c.dataSources).map(([k, v]) => `${k}: ${v}`).join('；')
      : '業界公開資訊估計';

    notice.innerHTML = `
      <div class="cs-notice-main">
        ⚙️ 已套用「<strong>${c.name}</strong>」預設參數
        ｜ ${c.contract} ｜ ${c.benefits}
      </div>
      <div class="cs-notice-warn">
        ⚠️ 數值僅供參考，請依對方實際職階與年資調整
        ${c.note ? `<br>💡 ${c.note}` : ''}
        <br>📎 資料來源：${sources}
      </div>`;
    notice.style.display = 'block';
  }

  function updateComparisonTable() {
    const c = COMPANY_DB[selectedCompanyId];
    const gs = GONGSHENG_COMPARE;
    const container = document.getElementById('cs-comparison');
    if (!c || !container) return;

    const rows = [
      ['合約制度', c.contract, gs.contract],
      ['產品選擇', c.comparison.productChoice, gs.productChoice],
      ['收入天花板', c.comparison.ceiling, gs.ceiling],
      ['勞健保', c.benefits, gs.benefits],
      ['培訓體系', c.comparison.training, gs.training],
      ['組織發展支援', c.comparison.orgDev || '—', gs.orgDev],
      ['品牌特色', c.comparison.brand || '—', gs.brand],
    ];

    // 加入佣金率對比（依身份別）
    const persona = PERSONA_MAP[typeof CID !== 'undefined' ? CID : 'insurance'];
    const defs = c.defaults[persona] || c.defaults.insurance || {};
    if (defs.commRate) {
      rows.splice(1, 0, ['首年佣金率', `~${defs.commRate}%`, `~${document.getElementById('i_rate_broker')?.value || 40}%`]);
    } else if (defs.personalComm) {
      rows.splice(1, 0, ['個人首佣率', `~${defs.personalComm}%`, `~${document.getElementById('i_rate_broker')?.value || 40}%`]);
    } else if (defs.altComm) {
      rows.splice(1, 0, ['首年佣金率', `~${defs.altComm}%`, `~${document.getElementById('i_rate_broker')?.value || 40}%`]);
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
      <div class="cs-disclaimer">
        ⚖️ ${disclaimerText}${lastUpdated ? ` ｜ 資料更新：${lastUpdated}` : ''}
      </div>`;
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
    const gs = GONGSHENG_COMPARE;
    if (!c) return;

    const persona = PERSONA_MAP[typeof CID !== 'undefined' ? CID : 'insurance'];
    const defs = c.defaults[persona] || c.defaults.insurance || {};
    const commRate = defs.commRate || defs.personalComm || defs.altComm || '—';
    const brokerRate = document.getElementById('i_rate_broker')?.value || 40;

    const lines = [
      '══ MDRT-BPS 制度對照表 ══',
      `對照：${c.name} vs 公勝保經`, '',
      `合約制度　│ ${c.contract} │ ${gs.contract}`,
      `首年佣金率│ ~${commRate}%  │ ~${brokerRate}%`,
      `產品選擇　│ ${c.comparison.productChoice} │ ${gs.productChoice}`,
      `收入天花板│ ${c.comparison.ceiling} │ ${gs.ceiling}`,
      `勞健保　　│ ${c.benefits} │ ${gs.benefits}`,
      `培訓體系　│ ${c.comparison.training} │ ${gs.training}`,
      `組織發展　│ ${c.comparison.orgDev || '—'} │ ${gs.orgDev}`,
      `品牌特色　│ ${c.comparison.brand || '—'} │ ${gs.brand}`,
      '',
      `📎 ${c.dataSources ? Object.values(c.dataSources).join('、') : '業界公開資訊'}`,
      `⚠️ 僅供參考，實際依各公司最新公告為準`,
    ];
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
