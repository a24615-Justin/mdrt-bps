// ─── BPS Calculator Module ──────────────────────────────────────────────────
// 純計算邏輯，不依賴 DOM。由 param-schema.js 的 schemaToComputeParams() 提供參數。
// lastUpdated: 2026-04-01

(function() {
  'use strict';

  // ─── 格式化工具 ─────────────────────────────────────────────────────────────
  const fmtM   = v => (Math.round(v) / 10000).toFixed(0);
  const fmtNT  = v => 'NT$ ' + Math.round(v).toLocaleString();
  const fmtPct = v => (v * 100).toFixed(0) + '%';

  // ─── 5 年累計收入計算（核心引擎） ────────────────────────────────────────────
  // p: compute params from schemaToComputeParams()
  // 回傳 { trad[], broker[], cumT[], cumB[], net[], beMonth, sum5trad, sum5broker, diff5 }
  function compute5yr(p) {
    const yrs = [1, 2, 3, 4, 5];
    let trad, broker;

    if (p._id === 'newbie') {
      const fyb_n = p.fyb || 1;
      trad = yrs.map(y => p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n * p.rate_trad);
      broker = yrs.map(y => {
        const base = p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n;
        return base * (1 - p.L) * p.rb + base * (1 - p.L) * p.ryr * (y - 1);
      });
    } else {
      const decay = p.ry_decay || 0.6;
      let ry_t = p.ry_sunk + (p._mRySunk || 0);
      const trad_ry = [ry_t];
      for (let y = 2; y <= 5; y++) {
        ry_t = ry_t * decay + p.FYP * (p.ryr || 0);
        trad_ry.push(ry_t);
      }
      trad = yrs.map((_, i) => p.FYP * p.rate_trad + trad_ry[i]);

      let ry_b = 0;
      const broker_ry = [0];
      for (let y = 2; y <= 5; y++) {
        ry_b = ry_b * decay + p.FYP * (1 - p.L) * (p.ryr || 0);
        broker_ry.push(ry_b);
      }
      broker = yrs.map((y, i) => {
        const fyp_i = p.FYP * (1 - p.L) * p.rb;
        const or_i  = (p.nrec || 0) * (p.rfyp || 0) * (p.or_ || 0) * (y === 1 ? 0.5 : 1);
        return fyp_i + broker_ry[i] + or_i;
      });
    }

    // 主管競業成本扣除
    if (p._id === 'manager' && p._legal) {
      broker[0] = Math.max(0, broker[0] - p._legal);
    }
    // 銀行理專轉換補貼
    if (p._id === 'banker' && p._subsidy) {
      broker[0] += p._subsidy;
    }

    const cumT = trad.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
    const cumB = broker.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
    const net  = cumB.map((b, i) => b - cumT[i]);

    // 黃金交叉月數
    let beMonth = null;
    if (net[0] > 0) {
      beMonth = 1;
    } else {
      for (let i = 1; i < 5; i++) {
        if (net[i] > 0) {
          const frac = Math.abs(net[i - 1]) / (net[i] - net[i - 1]);
          beMonth = Math.round((i + frac) * 12);
          break;
        }
      }
    }

    return {
      trad, broker, cumT, cumB, net, beMonth,
      sum5trad:  cumT[4],
      sum5broker: cumB[4],
      diff5:     net[4],
    };
  }

  // ─── 匯出全域 ─────────────────────────────────────────────────────────────
  window.compute5yr = compute5yr;
  window.fmtM   = fmtM;
  window.fmtNT  = fmtNT;
  window.fmtPct = fmtPct;

  console.log('[Calculator] ✅ 初始化完成');
})();
