// ─── 5-Year Income Chart Module (v6.0 — Chart.js + compute5yr 統一引擎) ────────
// 不再使用獨立 calc10YearIncome()，改為接收 compute5yr 參數統一計算
// 依賴：calculator.js（compute5yr, fmtM, fmtNT）、Chart.js CDN
// lastUpdated: 2026-04-10

(function() {
  'use strict';

  const CHART_CONTAINER_ID = 'income-chart-container';
  let chartInstance = null;

  // ─── 格式化金額 ──────────────────────────────────────────────────────────
  function formatMoney(n) {
    if (Math.abs(n) >= 10000) return Math.round(n / 10000).toLocaleString() + ' 萬';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + ' 千';
    return n.toLocaleString();
  }

  // ─── 渲染圖表 ──────────────────────────────────────────────────────────────
  function renderChart(containerId, computeParams) {
    const container = document.getElementById(containerId || CHART_CONTAINER_ID);
    if (!container) return;

    // 從外部取得 compute params（由 recalc() 傳入）
    if (!computeParams && typeof collectInputs !== 'undefined' && typeof schemaToComputeParams !== 'undefined') {
      var cid = (typeof CID !== 'undefined') ? CID : 'insurance';
      var values = collectInputs(cid);
      computeParams = schemaToComputeParams(values, cid);
    }
    if (!computeParams || typeof compute5yr === 'undefined') {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:14px">載入中…</div>';
      return;
    }

    // 異業身份（realtor/auto/medical）不顯示此圖表
    var cfg = (typeof ID_CONFIG !== 'undefined' && typeof CID !== 'undefined') ? (ID_CONFIG[CID] || {}) : {};
    if (cfg.crossIndustry) {
      container.innerHTML = '';
      return;
    }

    var r = compute5yr(computeParams);
    var tradLabel = cfg.tradLabel || '傳統公司';
    var brokerLabel = '轉換後';

    // 計算差距
    var gap = r.diff5;
    var gapPct = r.sum5trad > 0 ? ((Math.abs(gap) / r.sum5trad) * 100).toFixed(0) : '—';

    // 準備 canvas 容器
    container.innerHTML =
      '<div class="ic-v6">' +
        '<div class="ic-v6-header">' +
          '<div class="ic-v6-title">五年逐年收入對比</div>' +
          '<div class="ic-v6-subtitle">統一 compute5yr 引擎 · 基於您輸入的參數推演</div>' +
        '</div>' +
        '<div class="ic-v6-gap">' +
          '<span class="ic-v6-gap-num ' + (gap >= 0 ? 'pos' : 'neg') + '">' + (gap >= 0 ? '+' : '') + formatMoney(gap) + '</span>' +
          '<span class="ic-v6-gap-label">五年累計差距' + (gap >= 0 ? ' · 轉換後多 ' + gapPct + '%' : '') + '</span>' +
        '</div>' +
        '<div class="ic-v6-canvas-wrap"><canvas id="ic-v6-canvas"></canvas></div>' +
        '<div class="ic-v6-footer">模擬數據僅供趨勢參考，不構成收入承諾。實際收入因個人業績、公司政策、市場環境而異。</div>' +
      '</div>';

    var canvas = document.getElementById('ic-v6-canvas');
    if (!canvas || typeof Chart === 'undefined') {
      // Chart.js 尚未載入，fallback 純文字
      if (typeof Chart === 'undefined') {
        container.querySelector('.ic-v6-canvas-wrap').innerHTML =
          '<div style="padding:24px;text-align:center;color:#64748b;font-size:13px">' +
          '⚠️ Chart.js 載入中，請稍候重新整理</div>';
      }
      return;
    }

    // 銷毀舊 chart
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    var ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['第1年', '第2年', '第3年', '第4年', '第5年'],
        datasets: [
          {
            label: tradLabel + '（年收入）',
            data: r.trad,
            backgroundColor: 'rgba(220,38,38,0.7)',
            borderColor: '#dc2626',
            borderWidth: 1,
            borderRadius: 4,
            order: 2,
          },
          {
            label: brokerLabel + '（年收入）',
            data: r.broker,
            backgroundColor: 'rgba(37,99,235,0.7)',
            borderColor: '#2563eb',
            borderWidth: 1,
            borderRadius: 4,
            order: 2,
          },
          {
            label: '累計淨差距',
            data: r.net,
            type: 'line',
            borderColor: '#059669',
            backgroundColor: 'rgba(5,150,105,0.08)',
            borderWidth: 2.5,
            pointBackgroundColor: '#059669',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.3,
            yAxisID: 'y1',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: "'Outfit',sans-serif", size: 12, weight: '500' },
              padding: 14,
              usePointStyle: true,
              pointStyleWidth: 12,
            },
          },
          tooltip: {
            backgroundColor: '#1a2d42',
            titleFont: { family: "'Outfit',sans-serif", size: 13 },
            bodyFont: { family: "'DM Mono',monospace", size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx2) {
                var val = ctx2.parsed.y;
                var prefix = ctx2.dataset.label;
                if (ctx2.datasetIndex === 2) {
                  return prefix + '：' + (val >= 0 ? '+' : '') + (typeof fmtNT !== 'undefined' ? fmtNT(val) : val.toLocaleString());
                }
                return prefix + '：' + (typeof fmtNT !== 'undefined' ? fmtNT(val) : val.toLocaleString());
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "'Outfit',sans-serif", size: 13, weight: '600' },
              color: '#64748b',
            },
          },
          y: {
            beginAtZero: true,
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              font: { family: "'DM Mono',monospace", size: 11 },
              color: '#64748b',
              callback: function(value) { return formatMoney(value); },
            },
            title: {
              display: true,
              text: '年收入',
              font: { family: "'Outfit',sans-serif", size: 11 },
              color: '#94a3b8',
            },
          },
          y1: {
            beginAtZero: false,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "'DM Mono',monospace", size: 11 },
              color: '#059669',
              callback: function(value) { return (value >= 0 ? '+' : '') + formatMoney(value); },
            },
            title: {
              display: true,
              text: '累計淨差距',
              font: { family: "'Outfit',sans-serif", size: 11 },
              color: '#059669',
            },
          },
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
      },
    });
  }

  // ─── 匯出 ────────────────────────────────────────────────────────────────
  window.IncomeChart = {
    render:  function(id, params) { renderChart(id || CHART_CONTAINER_ID, params); },
    refresh: function(params) { renderChart(CHART_CONTAINER_ID, params); },
  };

  console.log('[Income Chart v6.0] ✅ Chart.js + compute5yr 統一引擎');
})();
