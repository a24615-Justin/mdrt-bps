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

    // v4.2→v4.3 修正: 來佣打折率（1.0 = 不打折，0.8 = 保司來佣先扣 20%）
    // 乘入 effectiveFYP，影響保經端首佣、續佣、組織獎金
    const fybDiscount = p.fybDiscount ?? 1.0;

    // v4.3: 傳統端隱形收入 + 保經端年終獎金
    const perfBonus = p.perfBonus ?? 0;           // 傳統端績效獎金
    const benefitsVal = p.benefitsValue ?? 0;     // 銀行福利年度價值
    const retirePenalty5 = (p.retirePenalty ?? 0) / 5; // 退職金損失平攤 5 年
    const brokerYEB = p.brokerYEB ?? 0;           // 保經年終獎金率（佣金 × %）

    if (p._id === 'newbie') {
      const fyb_n = p.fyb || 1;
      trad = yrs.map(y => {
        const base = p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n;
        return base * p.rate_trad;
      });
      broker = yrs.map(y => {
        const base = p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n;
        // newbie 保經端也用 brokerDecay；fybDiscount 已乘入 rb/ryr
        let ry_nb = 0;
        for (let prev = 1; prev < y; prev++) {
          ry_nb += base * (1 - p.L) * fybDiscount * (p.ryr || 0) * Math.pow(brokerDecay, y - prev - 1);
        }
        const brokerAnnual = base * (1 - p.L) * fybDiscount * p.rb + ry_nb;
        return brokerAnnual + brokerAnnual * brokerYEB;
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
        return growthFYP * p.rate_trad + trad_ry[i] + perfBonus + benefitsVal + retirePenalty5;
      });

      // ─── 保經端 ───
      const effectiveFYP = p.FYP * (1 - p.L) * fypShrink * fybDiscount;
      let ry_b = 0;
      const broker_ry = [0];
      for (let y = 2; y <= 5; y++) {
        ry_b = ry_b * brokerDecay + effectiveFYP * (p.ryr || 0);  // effectiveFYP 已含 fybDiscount
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
        const brokerAnnual = fyp_i + broker_ry[i] + or_i + postRenewal;
        return brokerAnnual + brokerAnnual * brokerYEB;
      });
    }

    // v4.2: 主管競業成本已移除（保險業無競業禁止）
    // 銀行理專轉換補貼
    if (p._id === 'banker' && p._subsidy) {
      broker[0] += p._subsidy;
    }

    const cumT = trad.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
    const cumB = broker.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
    const net  = cumB.map((b, i) => b - cumT[i]);

    // v3.0.2: 收入超越點用結構性收入計算，排除一次性項目（_subsidy）
    // 一次性項目只影響 Y1，不影響結構性趨勢判斷
    const structBroker = broker.slice();
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

  // ─── v4.2: 稅後試算 ──────────────────────────────────────────────────────────
  // 台灣保險從業人員稅務：執行業務所得（承攬制）or 薪資所得（僱傭制）
  // 二代健保補充保費 2.11%（單次給付 ≥ NT$28,000）
  // 所得稅：簡化累進稅率模型
  function computeAfterTax(annualIncome, type) {
    // type: 'employed'（壽險）或 'contractor'（保經）
    var taxable = annualIncome;
    var nhiSupplement = 0;

    if (type === 'contractor') {
      // 執行業務所得：必要費用率 20%（保險業務員）
      taxable = annualIncome * 0.80;
      // 二代健保補充保費（每月佣金 ≥ 28000）
      var monthlyAvg = annualIncome / 12;
      if (monthlyAvg >= 28000) {
        nhiSupplement = annualIncome * 0.0211;
      }
    } else {
      // 薪資所得：薪資特別扣除額 218,000
      taxable = Math.max(0, annualIncome - 218000);
    }

    // 標準扣除額 131,000 + 免稅額 97,000
    var netTaxable = Math.max(0, taxable - 131000 - 97000);

    // 累進稅率（簡化）
    var tax = 0;
    if (netTaxable <= 590000) tax = netTaxable * 0.05;
    else if (netTaxable <= 1330000) tax = 590000 * 0.05 + (netTaxable - 590000) * 0.12;
    else if (netTaxable <= 2660000) tax = 590000 * 0.05 + 740000 * 0.12 + (netTaxable - 1330000) * 0.20;
    else if (netTaxable <= 4980000) tax = 590000 * 0.05 + 740000 * 0.12 + 1330000 * 0.20 + (netTaxable - 2660000) * 0.30;
    else tax = 590000 * 0.05 + 740000 * 0.12 + 1330000 * 0.20 + 2320000 * 0.30 + (netTaxable - 4980000) * 0.40;

    var afterTax = annualIncome - tax - nhiSupplement;
    return {
      gross: annualIncome,
      tax: Math.round(tax),
      nhiSupplement: Math.round(nhiSupplement),
      afterTax: Math.round(afterTax),
      effectiveRate: annualIncome > 0 ? ((tax + nhiSupplement) / annualIncome) : 0
    };
  }

  // ─── v4.2: 敏感度分析 ───────────────────────────────────────────────────────
  // 輸入基準參數 + 要測試的 key + 偏移範圍，回傳各情境結果
  function sensitivityAnalysis(baseParams, testKey, offsets) {
    // offsets: [-0.2, -0.1, 0, 0.1, 0.2]（比例偏移）
    if (!offsets) offsets = [-0.20, -0.10, 0, 0.10, 0.20];
    var baseVal = baseParams[testKey];
    if (baseVal == null || baseVal === 0) return null;

    return offsets.map(function(offset) {
      var tweaked = Object.assign({}, baseParams);
      tweaked[testKey] = baseVal * (1 + offset);
      var result = compute5yr(tweaked);
      return {
        offset: offset,
        value: tweaked[testKey],
        diff5: result.diff5,
        beMonth: result.beMonth,
        sum5broker: result.sum5broker
      };
    });
  }

  // ─── 匯出全域 ─────────────────────────────────────────────────────────────
  window.compute5yr = compute5yr;
  window.computeAfterTax = computeAfterTax;
  window.sensitivityAnalysis = sensitivityAnalysis;
  window.fmtM   = fmtM;
  window.fmtNT  = fmtNT;
  window.fmtPct = fmtPct;

  console.log('[Calculator] ✅ 初始化完成（含稅後試算+敏感度分析）');
})();
