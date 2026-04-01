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
  //
  // v3.0.1 修正：
  //  - 傳統端續佣遞減用 ry_decay（公司端，如 0.6）
  //  - 保經端續佣遞減用 broker_ry_decay（公勝端，預設 0.85）
  //  - 傳統端加入年成長率 tradGrowth（預設 0 = 不成長）
  //  - 組織獎金加入增員脫落率 attrition（預設 20%/年）
  //  - 銀行理專加入保費縮水係數 fypShrink（預設 0.8）
  function compute5yr(p) {
    const yrs = [1, 2, 3, 4, 5];
    let trad, broker;

    // v3.0.1: 傳統端 vs 保經端分別使用不同續佣遞減
    const tradDecay   = p.ry_decay || 0.6;
    const brokerDecay = p.broker_ry_decay || 0.85;

    // v3.0.1: 傳統端年成長率（非 newbie 身份也適用）
    const tradGrowth = p.tradGrowth || 0;

    // v3.0.1: 增員年脫落率（組織獎金修正）
    const attrition = p.attrition ?? 0.20;

    // v3.0.2: 離職後續佣年數（傳統端沉沒續佣在轉職後仍持續 N 年）
    const postResignYrs = p.postResignYrs ?? 0;

    // v3.0.1: 銀行理專保費縮水係數
    const fypShrink = p._id === 'banker' ? (p.fypShrink ?? 0.8) : 1;

    if (p._id === 'newbie') {
      const fyb_n = p.fyb || 1;
      trad = yrs.map(y => p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n * p.rate_trad);
      broker = yrs.map(y => {
        const base = p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n;
        // newbie 保經端也用 brokerDecay
        let ry_nb = 0;
        for (let prev = 1; prev < y; prev++) {
          ry_nb += base * (1 - p.L) * (p.ryr || 0) * Math.pow(brokerDecay, y - prev - 1);
        }
        return base * (1 - p.L) * p.rb + ry_nb;
      });
    } else {
      // ─── 傳統端 ───
      let ry_t = p.ry_sunk + (p._mRySunk || 0);
      const trad_ry = [ry_t];
      for (let y = 2; y <= 5; y++) {
        ry_t = ry_t * tradDecay + p.FYP * Math.pow(1 + tradGrowth, y - 1) * (p.ryr || 0);
        trad_ry.push(ry_t);
      }
      trad = yrs.map((_, i) => {
        const growthFYP = p.FYP * Math.pow(1 + tradGrowth, i);
        return growthFYP * p.rate_trad + trad_ry[i];
      });

      // ─── 保經端 ───
      const effectiveFYP = p.FYP * (1 - p.L) * fypShrink;
      let ry_b = 0;
      const broker_ry = [0];
      for (let y = 2; y <= 5; y++) {
        ry_b = ry_b * brokerDecay + effectiveFYP * (p.ryr || 0);
        broker_ry.push(ry_b);
      }
      broker = yrs.map((y, i) => {
        const fyp_i = effectiveFYP * p.rb;
        // 組織獎金：增員人數逐年因脫落而減少
        const surviving = Math.max(0, (p.nrec || 0) * Math.pow(1 - attrition, Math.max(0, y - 1)));
        const or_i  = surviving * (p.rfyp || 0) * (p.or_ || 0) * (y === 1 ? 0.5 : 1);
        // v3.0.2: 離職後續佣（舊公司仍支付的續佣，逐年遞減）
        const postRenewal = (y <= postResignYrs)
          ? (p.ry_sunk + (p._mRySunk || 0)) * Math.pow(tradDecay, y)
          : 0;
        return fyp_i + broker_ry[i] + or_i + postRenewal;
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

    // v3.0.2: 收入超越點用結構性收入計算，排除一次性項目（_subsidy/_legal）
    // 一次性項目只影響 Y1，不影響結構性趨勢判斷
    const structBroker = broker.slice();
    if (p._id === 'manager' && p._legal) {
      structBroker[0] = structBroker[0] + p._legal; // 還原扣除的法律費
    }
    if (p._id === 'banker' && p._subsidy) {
      structBroker[0] = structBroker[0] - p._subsidy; // 還原加入的補貼
    }
    const structCumB = structBroker.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
    const structNet = structCumB.map((b, i) => b - cumT[i]);

    // 收入超越點月數（基於結構性收入）
    let beMonth = null;
    if (structNet[0] > 0) {
      beMonth = 1;
    } else {
      for (let i = 1; i < 5; i++) {
        if (structNet[i] > 0) {
          const frac = Math.abs(structNet[i - 1]) / (structNet[i] - structNet[i - 1]);
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
