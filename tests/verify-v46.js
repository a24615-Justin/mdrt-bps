#!/usr/bin/env node
/**
 * v4.6 驗算腳本 — 抽出 compute5yr + computeAfterTax 做離線測算
 * 用法: node tests/verify-v46.js
 */

// ─── 從 calculator.js 抽出核心（去掉 IIFE + window）───
function compute5yr(p) {
  const yrs = [1, 2, 3, 4, 5];
  let trad, broker;

  const persistency     = p.persistency ?? 0.90;
  const tradCommStep    = p.ry_decay || 0.6;
  const tradDecay       = persistency * tradCommStep;
  const brokerCommStep  = p.broker_comm_step ?? 0.95;
  const brokerDecay     = persistency * brokerCommStep;

  const tradGrowth = p.tradGrowth || 0;
  const attrition = p.attrition ?? 0.20;
  const postResignYrs = p.postResignYrs ?? 0;
  const fypShrink = p._id === 'banker' ? (p.fypShrink ?? 0.8) : 1;

  // v4.6: fybDiscount 已在 rb/ryr/or_ 中，不再此處使用

  const perfBonus = p.perfBonus ?? 0;
  const benefitsVal = p.benefitsValue ?? 0;
  const retirePenalty5 = (p.retirePenalty ?? 0) / 5;
  const brokerYEB = p.brokerYEB ?? 0;

  if (p._id === 'newbie') {
    const fyb_n = p.fyb || 1;
    trad = yrs.map(y => {
      const base = p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n;
      return base * p.rate_trad;
    });
    broker = yrs.map(y => {
      const base = p.FYP * Math.pow(1 + p._growth, y - 1) * fyb_n;
      let ry_nb = 0;
      for (let prev = 1; prev < y; prev++) {
        ry_nb += base * (1 - p.L) * (p.ryr || 0) * Math.pow(brokerDecay, y - prev - 1);
      }
      const brokerAnnual = base * (1 - p.L) * p.rb + ry_nb;
      return brokerAnnual + brokerAnnual * brokerYEB;
    });
  } else {
    const fixedIncome = p._fixedIncome ?? 0;
    const renewalSunk = p._renewalSunk ?? (p.ry_sunk + (p._mRySunk || 0));

    let ry_t = renewalSunk;
    const trad_ry = [ry_t];
    for (let y = 2; y <= 5; y++) {
      ry_t = ry_t * tradDecay + p.FYP * Math.pow(1 + tradGrowth, y - 1) * (p.ryr || 0) * persistency;
      trad_ry.push(ry_t);
    }
    trad = yrs.map((_, i) => {
      const growthFYP = p.FYP * Math.pow(1 + tradGrowth, i);
      return growthFYP * p.rate_trad + trad_ry[i] + fixedIncome + perfBonus + benefitsVal + retirePenalty5;
    });

    // v4.6: effectiveFYP 不含 fybDiscount
    const effectiveFYP = p.FYP * (1 - p.L) * fypShrink;
    let ry_b = 0;
    const broker_ry = [0];
    for (let y = 2; y <= 5; y++) {
      ry_b = ry_b * brokerDecay + effectiveFYP * (p.ryr || 0);
      broker_ry.push(ry_b);
    }
    broker = yrs.map((y, i) => {
      const fyp_i = effectiveFYP * p.rb;
      const surviving = Math.max(0, (p.nrec || 0) * Math.pow(1 - attrition, Math.max(0, y - 1)));
      const or_i  = surviving * (p.rfyp || 0) * (p.or_ || 0) * (y === 1 ? 0.5 : 1);
      const postRenewal = (y <= postResignYrs) ? renewalSunk * Math.pow(tradDecay, y) : 0;
      const brokerAnnual = fyp_i + broker_ry[i] + or_i + postRenewal;
      return brokerAnnual + brokerAnnual * brokerYEB;
    });
  }

  if (p._id === 'banker' && p._subsidy) {
    broker[0] += p._subsidy;
  }

  const cumT = trad.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
  const cumB = broker.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
  const net  = cumB.map((b, i) => b - cumT[i]);

  const structBroker = broker.slice();
  if (p._id === 'banker' && p._subsidy) {
    structBroker[0] = structBroker[0] - p._subsidy;
  }
  const structCumB = structBroker.reduce((a, v, i) => { a.push((a[i - 1] || 0) + v); return a; }, []);
  const structNet = structCumB.map((b, i) => b - cumT[i]);

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

  return { trad, broker, cumT, cumB, net, beMonth, sum5trad: cumT[4], sum5broker: cumB[4], diff5: net[4] };
}

function computeAfterTax(annualIncome, type) {
  var taxable = annualIncome;
  var nhiSupplement = 0;
  var selfPaidInsurance = 0;

  if (type === 'contractor') {
    taxable = annualIncome * 0.80;
    var monthlyAvg = annualIncome / 12;
    if (monthlyAvg >= 28000) nhiSupplement = annualIncome * 0.0211;
    selfPaidInsurance = 24000;
  } else {
    taxable = Math.max(0, annualIncome - 218000);
  }

  var netTaxable = Math.max(0, taxable - 131000 - 97000);
  var tax = 0;
  if (netTaxable <= 590000) tax = netTaxable * 0.05;
  else if (netTaxable <= 1330000) tax = 590000 * 0.05 + (netTaxable - 590000) * 0.12;
  else if (netTaxable <= 2660000) tax = 590000 * 0.05 + 740000 * 0.12 + (netTaxable - 1330000) * 0.20;
  else if (netTaxable <= 4980000) tax = 590000 * 0.05 + 740000 * 0.12 + 1330000 * 0.20 + (netTaxable - 2660000) * 0.30;
  else tax = 590000 * 0.05 + 740000 * 0.12 + 1330000 * 0.20 + 2320000 * 0.30 + (netTaxable - 4980000) * 0.40;

  var afterTax = annualIncome - tax - nhiSupplement - selfPaidInsurance;
  return {
    gross: annualIncome, tax: Math.round(tax), nhiSupplement: Math.round(nhiSupplement),
    selfPaidInsurance: Math.round(selfPaidInsurance), afterTax: Math.round(afterTax),
    effectiveRate: annualIncome > 0 ? ((tax + nhiSupplement + selfPaidInsurance) / annualIncome) : 0
  };
}

// ─── Helper ───
const fmt = v => Math.round(v).toLocaleString();
const fmtW = v => (v / 10000).toFixed(1) + '萬';
let passed = 0, failed = 0;

function assert(label, actual, expected, tolerance) {
  const tol = tolerance || 0.01; // 1% tolerance
  const diff = Math.abs(actual - expected);
  const pct = expected !== 0 ? diff / Math.abs(expected) : diff;
  if (pct <= tol) {
    passed++;
    return true;
  } else {
    failed++;
    console.log(`  ❌ ${label}: 預期 ${fmtW(expected)}, 實際 ${fmtW(actual)} (差 ${(pct*100).toFixed(1)}%)`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 1: 保險同業 — 國泰人壽 → 公勝（基準情境）
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ TEST 1: 保險同業 國泰→公勝 ══');
console.log('FYP=300萬, 商品佣金率60%, 國泰個人佣金20%, 續佣50萬, renewalDecay=0.98');
console.log('公勝: brokerComm=50%, 續佣率5%, fybDiscount=1.0, L=15%, brokerYEB=6%');

const productComm = 0.60;
const fybDiscount_gs = 1.0;
const t1 = compute5yr({
  FYP: 3000000,
  rate_trad: productComm * 0.20,             // 國泰 20%
  _fixedIncome: 0,
  _renewalSunk: 500000,
  ry_sunk: 500000,
  ry_decay: 0.98,                             // v4.6: 改為 0.98
  broker_comm_step: 0.95,
  tradGrowth: 0,
  postResignYrs: 0,
  L: 0.15,
  rb: productComm * fybDiscount_gs * 0.50,    // 0.60 × 1.0 × 0.50 = 0.30
  ryr: fybDiscount_gs * 0.05,                 // 1.0 × 0.05 = 0.05
  or_: 0,
  nrec: 0, rfyp: 0, fyb: 1,
  fybDiscount: fybDiscount_gs,
  perfBonus: 0,
  brokerYEB: 0.06,
});

// 手算驗證 — 傳統端 Y1:
// FYP × rate_trad = 3M × 0.12 = 360,000
// + renewalSunk = 500,000
// = 860,000
console.log(`\n傳統端 (年): ${t1.trad.map(v => fmtW(v)).join(' / ')}`);
console.log(`保經端 (年): ${t1.broker.map(v => fmtW(v)).join(' / ')}`);
console.log(`5年累計: 傳統 ${fmtW(t1.sum5trad)} / 保經 ${fmtW(t1.sum5broker)} / 差距 ${fmtW(t1.diff5)}`);
console.log(`收入超越月: ${t1.beMonth}`);

// 手算傳統 Y1: 3M × 0.6 × 0.20 + 500000 = 360000 + 500000 = 860000
assert('傳統Y1', t1.trad[0], 860000, 0.01);
// 手算傳統 Y2: FYP×rate_trad + renewalSunk×tradDecay + FYP×ryr×persistency
// tradDecay = 0.90 × 0.98 = 0.882
// = 360000 + 500000×0.882 + 3000000×0.05×0.90
// = 360000 + 441000 + 135000 = 936000
assert('傳統Y2', t1.trad[1], 936000, 0.01);

// 手算保經 Y1: effectiveFYP × rb × (1+YEB)
// effectiveFYP = 3M × (1-0.15) × 1 = 2,550,000 (v4.6: 不含 fybDiscount)
// fyp_i = 2,550,000 × 0.30 = 765,000
// broker_ry[0] = 0
// brokerAnnual = 765,000
// + YEB 6% = 765,000 × 1.06 = 810,900
assert('保經Y1', t1.broker[0], 810900, 0.01);

// 保經 Y2: fyp_i + broker_ry[1]
// broker_ry[1] = 0 × brokerDecay + 2550000 × 0.05 = 127,500
// brokerAnnual = 765,000 + 127,500 = 892,500
// + YEB 6% = 892,500 × 1.06 = 946,050
assert('保經Y2', t1.broker[1], 946050, 0.01);


// ═══════════════════════════════════════════════════════════════════
// TEST 2: fybDiscount 修正驗證 — 永達保經（fybDiscount=0.8）
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ TEST 2: 保險同業 國泰→永達（fybDiscount=0.8）══');
console.log('驗證 fybDiscount 不再雙重計算');

const fybDiscount_yd = 0.8;
const t2 = compute5yr({
  FYP: 3000000,
  rate_trad: productComm * 0.20,
  _fixedIncome: 0,
  _renewalSunk: 500000,
  ry_sunk: 500000,
  ry_decay: 0.98,
  broker_comm_step: 0.95,
  tradGrowth: 0,
  postResignYrs: 0,
  L: 0.15,
  rb: productComm * fybDiscount_yd * 0.38,    // 永達: 0.60 × 0.8 × 0.38 = 0.1824
  ryr: fybDiscount_yd * 0.045,                 // 0.8 × 0.045 = 0.036
  or_: fybDiscount_yd * 0.03,                  // 0.8 × 0.03 = 0.024
  nrec: 0, rfyp: 0, fyb: 1,
  fybDiscount: fybDiscount_yd,
  perfBonus: 0,
  brokerYEB: 0.06,
});

console.log(`傳統端 (年): ${t2.trad.map(v => fmtW(v)).join(' / ')}`);
console.log(`保經端 (年): ${t2.broker.map(v => fmtW(v)).join(' / ')}`);
console.log(`5年累計: 傳統 ${fmtW(t2.sum5trad)} / 保經 ${fmtW(t2.sum5broker)} / 差距 ${fmtW(t2.diff5)}`);

// 手算保經 Y1（v4.6 修正後）:
// effectiveFYP = 3M × 0.85 = 2,550,000 （不含 fybDiscount！）
// fyp_i = 2,550,000 × 0.1824 = 465,120
// brokerAnnual = 465,120 × 1.06 = 493,027.2
assert('永達保經Y1', t2.broker[0], 493027, 0.01);

// 如果 fybDiscount 被雙重計算（舊 bug），結果會是：
// effectiveFYP = 3M × 0.85 × 0.8 = 2,040,000
// fyp_i = 2,040,000 × 0.1824 = 372,096
// brokerAnnual = 372,096 × 1.06 = 394,422
// 差距 = 493,027 - 394,422 = 98,605（25% 低估！）
const bugResult = 394422;
console.log(`\n  ✅ v4.6 正確值: ${fmtW(t2.broker[0])}`);
console.log(`  ❌ v4.5 bug值:  ${fmtW(bugResult)} (低估 ${((493027-bugResult)/493027*100).toFixed(0)}%)`);


// ═══════════════════════════════════════════════════════════════════
// TEST 3: 銀行理專 — 富邦 → 公勝
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ TEST 3: 銀行理專 富邦→公勝 ══');
console.log('bankFYP=500萬, conv=40%, fixedSalary=85萬, benefits=8萬, adapt=6m');

const t3 = compute5yr({
  _id: 'banker',
  FYP: 5000000 * 0.40,                        // 2,000,000
  rate_trad: productComm * 0.08,               // 富邦 banker 8%
  _fixedIncome: 850000,                        // 底薪
  _renewalSunk: 0,
  ry_sunk: 0,
  ry_decay: 0.98,
  broker_comm_step: 0.95,
  tradGrowth: 0,
  fypShrink: 0.80,
  L: Math.min(6 / 24, 0.9),                   // 6/24 = 0.25
  rb: productComm * fybDiscount_gs * 0.50,     // 公勝
  ryr: fybDiscount_gs * 0.05,
  or_: 0, nrec: 0, rfyp: 0, fyb: 1,
  fybDiscount: fybDiscount_gs,
  perfBonus: 0,
  benefitsValue: 80000,
  brokerYEB: 0.06,
  _subsidy: 0,
});

console.log(`傳統端 (年): ${t3.trad.map(v => fmtW(v)).join(' / ')}`);
console.log(`保經端 (年): ${t3.broker.map(v => fmtW(v)).join(' / ')}`);
console.log(`5年累計: 傳統 ${fmtW(t3.sum5trad)} / 保經 ${fmtW(t3.sum5broker)} / 差距 ${fmtW(t3.diff5)}`);
console.log(`收入超越月: ${t3.beMonth}`);

// 手算 banker 傳統 Y1:
// FYP × rate_trad + fixedIncome + benefitsVal
// = 2M × 0.048 + 850000 + 0 + 80000 = 96000 + 850000 + 80000 = 1,026,000
assert('banker傳統Y1', t3.trad[0], 1026000, 0.01);

// banker 保經 Y1:
// effectiveFYP = 2M × (1-0.25) × 0.8 = 2M × 0.75 × 0.8 = 1,200,000
// fyp_i = 1,200,000 × 0.30 = 360,000
// brokerAnnual = 360,000 × 1.06 = 381,600
assert('banker保經Y1', t3.broker[0], 381600, 0.01);


// ═══════════════════════════════════════════════════════════════════
// TEST 4: 新人 — 公勝入行
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ TEST 4: 新人入行 → 公勝 ══');
console.log('newbieFyp=80萬, growth=15%, L=0.25, brokerComm=50%');

const t4 = compute5yr({
  _id: 'newbie',
  FYP: 800000,
  rate_trad: productComm * 0.18,               // 國泰新人 18%
  ry_sunk: 0, ry_decay: 0.98,
  broker_comm_step: 0.95,
  L: 0.25,
  rb: productComm * fybDiscount_gs * 0.50,     // 0.30
  ryr: fybDiscount_gs * 0.05,
  or_: 0, nrec: 0, rfyp: 0,
  fyb: 1,
  _growth: 0.15,
  fybDiscount: fybDiscount_gs,
  brokerYEB: 0.06,
});

console.log(`傳統端 (年): ${t4.trad.map(v => fmtW(v)).join(' / ')}`);
console.log(`保經端 (年): ${t4.broker.map(v => fmtW(v)).join(' / ')}`);
console.log(`5年累計: 傳統 ${fmtW(t4.sum5trad)} / 保經 ${fmtW(t4.sum5broker)} / 差距 ${fmtW(t4.diff5)}`);
console.log(`收入超越月: ${t4.beMonth}`);

// 新人傳統 Y1: FYP × rate_trad = 800000 × 0.108 = 86,400
assert('newbie傳統Y1', t4.trad[0], 86400, 0.01);

// 新人保經 Y1: base × (1-L) × rb × (1+YEB)
// base = 800000 × 1 = 800000
// = 800000 × 0.75 × 0.30 × 1.06 = 190,800
assert('newbie保經Y1', t4.broker[0], 190800, 0.01);

// 新人傳統 Y2: FYP × (1+g) × rate_trad = 800000 × 1.15 × 0.108 = 99,360
assert('newbie傳統Y2', t4.trad[1], 99360, 0.01);


// ═══════════════════════════════════════════════════════════════════
// TEST 5: 稅後試算
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ TEST 5: 稅後試算 ══');

// Case A: 壽險 employed, 年收 120 萬
const taxA = computeAfterTax(1200000, 'employed');
console.log(`\n壽險 employed 年收120萬:`);
console.log(`  應稅所得: 120萬 - 21.8萬(薪資扣除) = 98.2萬`);
console.log(`  淨課稅: 98.2萬 - 13.1萬(標扣) - 9.7萬(免稅) = 75.4萬`);
console.log(`  稅: 59萬×5% + (75.4-59)萬×12% = 29500 + 19680 = 49,180`);
console.log(`  實際: 稅=${fmt(taxA.tax)}, 二代健保=${fmt(taxA.nhiSupplement)}, 勞保自付=${fmt(taxA.selfPaidInsurance)}, 稅後=${fmt(taxA.afterTax)}`);
assert('employed稅額', taxA.tax, 49180, 0.01);
assert('employed勞保自付', taxA.selfPaidInsurance, 0, 0);
assert('employed稅後', taxA.afterTax, 1200000 - 49180, 0.01);

// Case B: 保經 contractor, 年收 150 萬
const taxB = computeAfterTax(1500000, 'contractor');
console.log(`\n保經 contractor 年收150萬:`);
console.log(`  應稅所得: 150萬 × 0.80 = 120萬`);
console.log(`  淨課稅: 120萬 - 13.1萬 - 9.7萬 = 97.2萬`);
console.log(`  稅: 59萬×5% + (97.2-59)萬×12% = 29500 + 45840 = 75,340`);
console.log(`  二代健保: 150萬 × 2.11% = 31,650`);
console.log(`  勞保自付: 24,000`);
console.log(`  實際: 稅=${fmt(taxB.tax)}, 二代健保=${fmt(taxB.nhiSupplement)}, 勞保自付=${fmt(taxB.selfPaidInsurance)}, 稅後=${fmt(taxB.afterTax)}`);
assert('contractor稅額', taxB.tax, 75340, 0.01);
assert('contractor二代健保', taxB.nhiSupplement, 31650, 0.01);
assert('contractor勞保自付', taxB.selfPaidInsurance, 24000, 0);
assert('contractor稅後', taxB.afterTax, 1500000 - 75340 - 31650 - 24000, 0.01);

// Case C: 高收入 contractor, 年收 500 萬
const taxC = computeAfterTax(5000000, 'contractor');
console.log(`\n高收入 contractor 年收500萬:`);
console.log(`  應稅: 500萬 × 0.80 = 400萬`);
console.log(`  淨課稅: 400萬 - 13.1萬 - 9.7萬 = 377.2萬`);
console.log(`  稅: 59×5% + 74×12% + 133×20% + (377.2-266)×30%`);
console.log(`     = 29500 + 88800 + 266000 + 333600 = 717,900`);
console.log(`  二代健保: 500萬 × 2.11% = 105,500`);
console.log(`  實際: 稅=${fmt(taxC.tax)}, 二代健保=${fmt(taxC.nhiSupplement)}, 稅後=${fmt(taxC.afterTax)}`);
assert('高收contractor稅額', taxC.tax, 717900, 0.01);


// ═══════════════════════════════════════════════════════════════════
// TEST 6: 邊界值
// ═══════════════════════════════════════════════════════════════════
console.log('\n══ TEST 6: 邊界值 ══');

// FYP = 0
const t6a = compute5yr({
  FYP: 0, rate_trad: 0.12, _fixedIncome: 0, _renewalSunk: 0, ry_sunk: 0,
  ry_decay: 0.98, broker_comm_step: 0.95, L: 0.15, rb: 0.30, ryr: 0.05,
  or_: 0, nrec: 0, rfyp: 0, fyb: 1, brokerYEB: 0,
});
assert('FYP=0 傳統Y1', t6a.trad[0], 0, 0);
assert('FYP=0 保經Y1', t6a.broker[0], 0, 0);
console.log('  ✅ FYP=0: 全為 0，無 NaN');

// L = 100%
const t6b = compute5yr({
  FYP: 3000000, rate_trad: 0.12, _fixedIncome: 0, _renewalSunk: 500000, ry_sunk: 500000,
  ry_decay: 0.98, broker_comm_step: 0.95, L: 1.0, rb: 0.30, ryr: 0.05,
  or_: 0, nrec: 0, rfyp: 0, fyb: 1, brokerYEB: 0,
});
assert('L=100% 保經Y1', t6b.broker[0], 0, 0);
console.log('  ✅ L=100%: 保經收入為 0');

// 零收入稅後
const t6c = computeAfterTax(0, 'contractor');
assert('零收入稅後', t6c.afterTax, -24000, 0);  // 只有勞保自付
console.log(`  ⚠️ 零收入 contractor: afterTax = ${fmt(t6c.afterTax)}（僅扣勞保自付）`);


// ═══════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(50));
console.log(`✅ PASSED: ${passed}  ❌ FAILED: ${failed}`);
console.log('═'.repeat(50));
process.exit(failed > 0 ? 1 : 0);
