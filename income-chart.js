// ─── 10-Year Income Gap Chart Module ─────────────────────────────────────────
// 依賴：companies.js（COMPANY_DB — 公勝參數從 COMPANY_DB['gongsheng'] 讀取）
// 用純 CSS + DOM 繪製橫條動畫圖表，不依賴外部 charting library
// lastUpdated: 2026-04-01

(function() {
  'use strict';

  // ─── 收入模型參數 ──────────────────────────────────────────────────────────
  // 假設：年繳保費 100 萬（FYP），每年新增相同保費
  const BASE_FYP = 1000000; // 年繳保費 100 萬

  // 公勝參數從 COMPANY_DB 動態讀取（P0-8 遷移）
  function getGsParams() {
    const gs = (typeof COMPANY_DB !== 'undefined') ? COMPANY_DB['gongsheng'] : null;
    const gsDefs = gs?.defaults?.insurance || {};
    return {
      comm:         gsDefs.commRateTrad ?? 40,
      renewal:      gsDefs.renewalRate ?? 5,
      renewalDecay: gs?.renewalDecay ?? 0.85,
      orgRate:      5, // 組織津貼率 %（假設帶 3 人）
      orgMembers:   3,
      orgMemberFyp: 600000,
    };
  }

  // ─── 計算 10 年累計收入 ─────────────────────────────────────────────────────
  function calc10YearIncome(commRate, renewalRate, renewalDecay, hasOrg, orgAllowance) {
    // 邊界值防護：避免異常輸入導致荒謬結果
    commRate = Math.max(0, Math.min(100, Number(commRate) || 0));
    renewalRate = Math.max(0, Math.min(100, Number(renewalRate) || 0));
    renewalDecay = Math.max(0, Math.min(1, Number(renewalDecay) || 0));
    orgAllowance = Math.max(0, Number(orgAllowance) || 0);

    const years = [];
    let cumulative = 0;

    for (let y = 1; y <= 10; y++) {
      // 首佣：每年新保單
      let yearIncome = BASE_FYP * (commRate / 100);

      // 續佣：之前每年保單的續佣（遞減）
      for (let prev = 1; prev < y; prev++) {
        const decayFactor = Math.pow(renewalDecay, y - prev - 1);
        yearIncome += BASE_FYP * (renewalRate / 100) * decayFactor;
      }

      // 組織津貼
      if (hasOrg && orgAllowance > 0) {
        yearIncome += orgAllowance;
      } else if (hasOrg && y >= 3) {
        // 公勝端：第 3 年起有組織津貼（從 COMPANY_DB 動態讀取）
        const gsp = getGsParams();
        yearIncome += gsp.orgMembers * gsp.orgMemberFyp * (gsp.orgRate / 100);
      }

      cumulative += yearIncome;
      years.push({
        year: y,
        annual: Math.round(yearIncome),
        cumulative: Math.round(cumulative),
      });
    }
    return years;
  }

  // ─── 取得對方公司的佣金參數 ────────────────────────────────────────────────
  function getCompanyParams(companyId) {
    const c = COMPANY_DB[companyId];
    if (!c) return { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 };

    const persona = typeof CID !== 'undefined' ? CID : 'insurance';
    const defs = c.defaults[persona] || c.defaults.insurance || {};

    return {
      commRate: defs.commRateTrad ?? 20,
      renewalRate: defs.renewalRate ?? (defs.mgrRenewal ? (defs.mgrRenewal / BASE_FYP * 100) : 3),
      renewalDecay: defs.renewalDecay ?? 0.6,
      orgAllowance: defs.orgAllowance ?? 0,
    };
  }

  // ─── 格式化金額 ──────────────────────────────────────────────────────────
  function formatMoney(n) {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + ' 千萬';
    if (n >= 10000) return Math.round(n / 10000).toLocaleString() + ' 萬';
    return n.toLocaleString();
  }

  // ─── 渲染圖表 ──────────────────────────────────────────────────────────────
  function renderChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const companyId = (typeof selectedCompanyId !== 'undefined')
      ? selectedCompanyId
      : (window.CompanySelector ? window.CompanySelector.getSelectedId() : 'cathay-life');
    const company = COMPANY_DB[companyId];
    if (!company) return;

    const params = getCompanyParams(companyId);
    const tradData = calc10YearIncome(params.commRate, params.renewalRate || 3, params.renewalDecay, true, params.orgAllowance);
    const gsp = getGsParams();
    const gsData = calc10YearIncome(gsp.comm, gsp.renewal, gsp.renewalDecay, true, 0);

    const maxVal = Math.max(gsData[9].cumulative, tradData[9].cumulative);
    const gap = gsData[9].cumulative - tradData[9].cumulative;
    const gapPercent = ((gap / tradData[9].cumulative) * 100).toFixed(0);

    // Highlight years: 1, 3, 5, 10
    const keyYears = [0, 2, 4, 9]; // indices

    container.innerHTML = `
      <div class="ic-container">
        <div class="ic-header">
          <div class="ic-title">📈 十年累計收入差距模擬</div>
          <div class="ic-subtitle">
            假設每年新增 FYP ${formatMoney(BASE_FYP)}，第 3 年起帶組織 ${gsp.orgMembers} 人
          </div>
        </div>

        <div class="ic-highlight">
          <div class="ic-gap-number">${formatMoney(Math.abs(gap))}</div>
          <div class="ic-gap-label">
            十年累計差距｜公勝多出 <strong>${gapPercent}%</strong>
          </div>
        </div>

        <div class="ic-bars">
          ${keyYears.map(i => {
            const d = tradData[i];
            const g = gsData[i];
            const tradPct = (d.cumulative / maxVal * 100).toFixed(1);
            const gsPct = (g.cumulative / maxVal * 100).toFixed(1);
            const yearGap = g.cumulative - d.cumulative;
            return `
              <div class="ic-bar-group">
                <div class="ic-bar-year">第 ${d.year} 年</div>
                <div class="ic-bar-pair">
                  <div class="ic-bar-row">
                    <span class="ic-bar-label ic-label-trad">${company.short}</span>
                    <div class="ic-bar-track">
                      <div class="ic-bar ic-bar-trad" style="width:${tradPct}%;" data-delay="${i * 150}"></div>
                    </div>
                    <span class="ic-bar-val">${formatMoney(d.cumulative)}</span>
                  </div>
                  <div class="ic-bar-row">
                    <span class="ic-bar-label ic-label-gs">公勝</span>
                    <div class="ic-bar-track">
                      <div class="ic-bar ic-bar-gs" style="width:${gsPct}%;" data-delay="${i * 150 + 80}"></div>
                    </div>
                    <span class="ic-bar-val">${formatMoney(g.cumulative)}</span>
                  </div>
                </div>
                ${yearGap > 0 ? `<div class="ic-bar-diff">+${formatMoney(yearGap)}</div>` : ''}
              </div>`;
          }).join('')}
        </div>

        <div class="ic-footer">
          ⚠️ 模擬數據僅供參考，基於公開佣金率估算，不含獎金、津貼等變動項目。
          實際收入依個人業績與公司政策而定。
        </div>
      </div>`;

    // 動畫觸發
    requestAnimationFrame(() => {
      container.querySelectorAll('.ic-bar').forEach(bar => {
        const delay = parseInt(bar.dataset.delay) || 0;
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
          bar.style.width = targetWidth;
        }, 100 + delay);
      });
    });
  }

  // ─── v3.0: 直接使用 index.html 中的 #income-chart-container ─────────────
  // 不再需要 injectChartContainer()，容器已寫在 HTML 中

  // ─── 防止重複初始化 ──────────────────────────────────────────────────────
  let initialized = false;

  // ─── 初始化 ────────────────────────────────────────────────────────────────
  const CHART_CONTAINER_ID = 'income-chart-container';

  // v3.0.2: loading skeleton
  function showSkeleton() {
    const container = document.getElementById(CHART_CONTAINER_ID);
    if (!container || container.querySelector('.ic-skeleton')) return;
    container.innerHTML = `
      <div class="ic-skeleton">
        <div class="ic-sk-title"></div>
        <div class="ic-sk-bar" style="width:60%"></div>
        <div class="ic-sk-bar" style="width:80%"></div>
        <div class="ic-sk-bar" style="width:45%"></div>
        <div class="ic-sk-bar" style="width:90%"></div>
      </div>`;
  }

  function initChart() {
    if (initialized) return;
    if (typeof COMPANY_DB === 'undefined') { showSkeleton(); return; }
    initialized = true;

    renderChart(CHART_CONTAINER_ID);

    // v3.0: recalc() 已統一呼叫 IncomeChart.render()，不需額外監聽
    console.log('[Income Chart] ✅ 初始化完成');
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initChart, 200));
  } else {
    setTimeout(initChart, 200);
  }

  // 匯出（v3.0: render + refresh 均指向同一函式，相容新舊呼叫）
  window.IncomeChart = {
    render:  (id) => renderChart(id || CHART_CONTAINER_ID),
    refresh: ()   => renderChart(CHART_CONTAINER_ID),
  };

})();
