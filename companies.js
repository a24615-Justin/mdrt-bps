// ─── Company Data Model v3.0 ────────────────────────────────────────────────
// 公司制度資料庫 — 所有預設數值均標註來源，供使用者查核
// v3.0 變更：defaults key 統一為 PARAM_SCHEMA schemaKey + GONGSHENG_COMPARE 合併
// 新增公司：複製任一物件，修改 id/name/defaults 即可
// lastUpdated: 2026-04-01
// dataDisclaimer: 數值為公開資訊整理，實際依個人職階與年資有所不同

/**
 * @typedef {Object} PersonaDefaults
 * @property {number} [commRateTrad]    - 傳統公司首年佣金率 (%)（統一 key）
 * @property {number} [renewalRate]     - 續期佣金率 (%)
 * @property {number} [renewalDecay]    - 續佣年遞減係數 (0-1)
 * @property {number} [orgAllowance]    - 組織津貼 (NT$)
 * @property {number} [fixedSalary]     - 固定薪資 (NT$)
 * @property {number} [mgrRenewal]      - 個人續期佣金 (NT$)（原 personalRenewal）
 */

/**
 * @typedef {Object} CompanyEntry
 * @property {string} name              - 公司全名
 * @property {string} short             - 簡稱（Chip 顯示）
 * @property {string} [icon]            - Emoji 圖標
 * @property {'life'|'broker'|'custom'} type - 公司類別
 * @property {string} contract          - 合約制度
 * @property {string} benefits          - 勞健保說明
 * @property {string} marketShare       - 市占率
 * @property {string} lastVerified      - 資料最後驗證日期（YYYY-MM-DD）
 * @property {Object} [dataSources]     - 各欄位資料來源
 * @property {Object.<string, PersonaDefaults>} defaults - 各身份別預設值（key = PARAM_SCHEMA schemaKey）
 * @property {Object} [brokerDefaults]  - 保經端預設（僅 broker 類型）
 * @property {Object} comparison        - 制度對照文字
 * @property {Object[]} [ranks]         - 職級晉升表（僅公勝）
 * @property {Object[]} [perfBonusTiers]- 績效獎金門檻（僅公勝）
 * @property {number} [maxComm]         - 最高佣金率（僅公勝）
 * @property {string} [note]            - 備註
 */

/** @type {Object.<string, CompanyEntry>} */

const COMPANY_DB = {
  // ═══ 壽險公司 ═══
  'cathay-life': {
    name: '國泰人壽', short: '國泰', icon: '🌳', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '21.3%',
    lastVerified: '2026-03-30',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '業務員支給暨管理辦法 11313V2（業績津貼率2-32%）',
      contract: '國泰人壽官網業務合作專區',
    },
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 8, fixedSalary: 800000 },
      manager:   { commRateTrad: 22, orgAllowance: 800000, mgrRenewal: 200000 },
      medical:   { commRateTrad: 15 },
      newbie:    { commRateTrad: 18 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '大型品牌光環',
      orgDev: '固定晉升階梯，需達組織人力門檻',
    },
    annualBonusPct: 5, // 年終+季獎金估計（FYP 比例）
    note: '雙合約制（承攬+僱傭），提供勞健保、勞退、團險',
  },
  'fubon-life': {
    name: '富邦人壽', short: '富邦', icon: '🦁', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '14.8%',
    lastVerified: '2026-03-30',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '同仁手冊(菁英版-行銷專員CA) 1120630修改版',
      bonusTable: '同仁手冊(菁英版-通則) 1131212修訂',
      contract: '富邦人壽官網業務招募專區',
    },
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 8, fixedSalary: 850000 },
      manager:   { commRateTrad: 21, orgAllowance: 900000, mgrRenewal: 200000 },
      medical:   { commRateTrad: 15 },
      newbie:    { commRateTrad: 18 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '金融集團整合優勢',
      orgDev: '固定晉升階梯，需達組織人力門檻',
    },
    annualBonusPct: 5,
    note: '金控體系，銀行保險通路強',
  },
  'nanshan-life': {
    name: '南山人壽', short: '南山', icon: '⛰️', type: 'life',
    contract: '純承攬制', benefits: '自行投保',
    marketShare: '12.4%',
    lastVerified: '2026-03-30',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '2024 業界公開徵才資訊中位數',
      contract: '南山人壽官網增員專區',
    },
    defaults: {
      insurance: { commRateTrad: 25, renewalRate: 4, renewalDecay: 0.65, orgAllowance: 0 },
      banker:    { commRateTrad: 0, fixedSalary: 0 },
      manager:   { commRateTrad: 25, orgAllowance: 600000, mgrRenewal: 250000 },
      medical:   { commRateTrad: 18 },
      newbie:    { commRateTrad: 22 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受組織架構限制',
      training: '完整培訓體系',
      brand: '老牌聲譽',
      orgDev: '組織層級多，晉升路徑長',
    },
    annualBonusPct: 3,
    note: '純承攬制，佣金率較高但無勞健保',
  },
  'shin-kong-life': {
    name: '新光人壽', short: '新光', icon: '✨', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '7.7%',
    lastVerified: '2026-03-30',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '2024 業界公開徵才資訊中位數',
      contract: '新光人壽官網業務專區',
    },
    defaults: {
      insurance: { commRateTrad: 19, renewalRate: 2.5, renewalDecay: 0.55, orgAllowance: 0 },
      banker:    { commRateTrad: 7, fixedSalary: 750000 },
      manager:   { commRateTrad: 20, orgAllowance: 700000, mgrRenewal: 180000 },
      medical:   { commRateTrad: 14 },
      newbie:    { commRateTrad: 17 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '老牌品牌',
      orgDev: '固定晉升階梯，需達組織人力門檻',
    },
    annualBonusPct: 4,
    note: '雙合約制，新人財務補助計畫',
  },
  'allianz-life': {
    name: '安聯人壽', short: '安聯', icon: '🛡️', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '3.2%',
    lastVerified: '2026-03-30',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '安聯人壽業務規則 2022/12/21修訂',
      bonusTable: '安聯佣金表',
    },
    defaults: {
      insurance: { commRateTrad: 25, renewalRate: 4, renewalDecay: 0.65, orgAllowance: 0 },
      banker:    { commRateTrad: 10, fixedSalary: 700000 },
      manager:   { commRateTrad: 27, orgAllowance: 600000, mgrRenewal: 220000 },
      medical:   { commRateTrad: 18 },
      newbie:    { commRateTrad: 22 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '外商品牌、投資型商品強',
      orgDev: '固定晉升階梯，業績獎金月FYP>10K→FYC 10%',
    },
    annualBonusPct: 8,
    note: '雙合約制（僱傭+承攬），WL1N首佣20-39%、ND10首佣38%、年終3-15%',
  },
  'taishin-life': {
    name: '台新人壽', short: '台新', icon: '🌟', type: 'life',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '1.8%',
    lastVerified: '2026-03-30',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '台新佣金表 113年11月04日修訂',
    },
    defaults: {
      insurance: { commRateTrad: 30, renewalRate: 4, renewalDecay: 0.7, orgAllowance: 0 },
      banker:    { commRateTrad: 0, fixedSalary: 0 },
      manager:   { commRateTrad: 30, orgAllowance: 400000, mgrRenewal: 250000 },
      medical:   { commRateTrad: 20 },
      newbie:    { commRateTrad: 28 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '依個人能力',
      training: '自主學習為主',
      brand: '獨立經營、佣金率較高',
      orgDev: '無組織負擔，個人導向',
    },
    annualBonusPct: 2,
    note: '獨立經營壽險，NWLB首佣15-55%、TLA首佣35-55%、集繳件折扣-2~-5%',
  },

  'china-life': {
    name: '中國人壽', short: '中壽', icon: '🏛️', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '5.1%',
    lastVerified: '2026-04-06',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '中壽業務人員管理辦法（業界估計中位數）',
    },
    defaults: {
      insurance: { commRateTrad: 22, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 8, fixedSalary: 700000 },
      manager:   { commRateTrad: 24, orgAllowance: 700000, mgrRenewal: 180000 },
      medical:   { commRateTrad: 16 },
      newbie:    { commRateTrad: 20 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系+數位學院',
      brand: '壽險市占前五、開發金控旗下',
      orgDev: '固定晉升制度，通訊處經營模式',
    },
    note: '開發金控旗下；IFRS17 後投資型商品調整中',
  },
  'taiwan-life': {
    name: '台灣人壽', short: '台壽', icon: '🏢', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '5.8%',
    lastVerified: '2026-04-06',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '台灣人壽業務規範（業界估計中位數）',
    },
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 9, fixedSalary: 750000 },
      manager:   { commRateTrad: 22, orgAllowance: 750000, mgrRenewal: 200000 },
      medical:   { commRateTrad: 15 },
      newbie:    { commRateTrad: 18 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓+中信金控資源',
      brand: '中信金控旗下、壽險前五大',
      orgDev: '傳統通訊處+銀行通路雙軌，組織晉升穩定',
    },
    note: '中信金控旗下；銀行通路佔比高；2024合併前台灣人壽',
  },
  'mercuries-life': {
    name: '三商美邦人壽', short: '三商', icon: '🔷', type: 'life',
    contract: '承攬制', benefits: '部分有勞健保',
    marketShare: '2.5%',
    lastVerified: '2026-04-06',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '三商美邦業務規範（業界估計中位數）',
    },
    defaults: {
      insurance: { commRateTrad: 25, renewalRate: 4, renewalDecay: 0.65, orgAllowance: 0 },
      banker:    { commRateTrad: 0, fixedSalary: 0 },
      manager:   { commRateTrad: 28, orgAllowance: 500000, mgrRenewal: 200000 },
      medical:   { commRateTrad: 18 },
      newbie:    { commRateTrad: 22 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '依個人能力+職階',
      training: '內部培訓+年度大會',
      brand: '三商集團旗下、承攬制先驅',
      orgDev: '承攬制彈性高，個人經營導向',
    },
    note: '承攬制老牌壽險；佣金結構較接近保經模式',
  },

  // ═══ 公勝保經（教材主角）═══
  // GONGSHENG_COMPARE 已合併至此，v3.0 不再有獨立常數
  'gongsheng': {
    name: '公勝保經', short: '公勝', icon: '🏅', type: 'broker',
    contract: '承攬制（純C計佣）', benefits: '自行投保（職業工會）',
    marketShare: '連續 7 年保經業第一（2024 營收 44.7 億 / MDRT 710 人）',
    lastVerified: '2026-04-01',
    dataSources: {
      marketShare: '鉅亨網 2025/2：2024 營收 44.7 億（YoY +47%）、千大企業第 583 名→連續 7 年中華徵信所保經業第一',
      commRate: '公勝保經 2026 制度架構圖',
      contract: '公勝保經官方制度說明',
      mdrt: '2024 MDRT 710 人（達成率 118%）、2026 目標 1,000 人',
    },
    defaults: {
      // 以「專員」為預設起點，使用者可依實際職級調整
      insurance: { commRateTrad: 50, renewalRate: 5, renewalDecay: 0.85, orgAllowance: 0 },
      banker:    { commRateTrad: 50, fixedSalary: 0 },
      manager:   { commRateTrad: 68, orgAllowance: 0, mgrRenewal: 0 },
      medical:   { commRateTrad: 50 },
      newbie:    { commRateTrad: 50 },
    },
    brokerDefaults: { brokerComm: 50, renewalRate: 5, orgRate: 5, deskFee: 3000, fybDiscount: 1.0 },
    comparison: {
      productChoice: '多家保司產品，各家來佣100%FYC',
      ceiling: '無上限（累積晉升，永不歸零）',
      training: 'MDRT 系統培訓 + Legacy Grid 輔銷武器庫',
      brand: '連續七年保經業第一',
      orgDev: '六職級（專員50%→事業部經理82%+）+ 三代加發8% + 績效獎金4%',
    },
    // 職級晉升門檻（整組累計FYC）— 原 GONGSHENG_COMPARE.ranks
    ranks: [
      { title: '專員',     commRate: 50, fycThreshold: 0,       orgAllowance: 5 },
      { title: '主任',     commRate: 60, fycThreshold: 150000,  orgAllowance: 5 },
      { title: '襄理',     commRate: 68, fycThreshold: 400000,  orgAllowance: 4 },
      { title: '副理',     commRate: 74, fycThreshold: 1000000, orgAllowance: 2 },
      { title: '經理',     commRate: 78, fycThreshold: 1800000, orgAllowance: 1.5 },
      { title: '事業部經理', commRate: 82, fycThreshold: 3000000, orgAllowance: 0, perfBonus: '1-4%', threeGen: '5%+2%+1%=8%' },
    ],
    // 事業部月績效獎金 — 原 GONGSHENG_COMPARE.perfBonusTiers
    perfBonusTiers: [
      { fycMin: 300000,  bonus: 1 },
      { fycMin: 600000,  bonus: 2 },
      { fycMin: 1500000, bonus: 3 },
      { fycMin: 2000000, bonus: 4 },
    ],
    maxComm: 94, // 82% + 8%(三代) + 4%(績效)
    renewalDecay: 0.85, // 公勝續佣遞減（原 income-chart.js GONGSHENG_RENEWAL_DECAY）
    note: '專員50% → 主任60% → 襄理68% → 副理74% → 經理78% → 事業部經理82%+，最高94%',
  },

  // ═══ 保經公司（競品）═══
  'yongda': {
    name: '永達保經', short: '永達', icon: '🏛️', type: 'broker',
    contract: '承攬制', benefits: '自行投保（職業工會）',
    marketShare: '2024 新契約保費 24 億 / 業務 2,520 人',
    lastVerified: '2026-04-01',
    dataSources: {
      marketShare: '永達保經 2025/1 經濟日報：2024 新契約保費 24 億、營收 25.37 億、業務 2,520 人',
      commRate: '2024 公開增員說明會資料＋業界中位數推估',
      mdrt: '2024 MDRT 307 位（平均每 2 人有 1 位 MDRT）',
    },
    defaults: {
      insurance: { commRateTrad: 22, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 22, fixedSalary: 0 },
      manager:   { commRateTrad: 28, orgAllowance: 0, mgrRenewal: 0 },
      medical:   { commRateTrad: 22 },
      newbie:    { commRateTrad: 20 },
    },
    brokerDefaults: { brokerComm: 38, renewalRate: 4.5, orgRate: 3, deskFee: 3500, fybDiscount: 0.8 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: 'MDRT 導師傳承制（2024 終身會員 111 位）',
      brand: '上市公司（興櫃）、兩岸布局、保單繼續率 97%',
      orgDev: '增員獎 2.4 萬/人＋晉級獎最高 310 萬，2025 目標 3,000 人',
    },
    note: '2024 新契約保費 24 億、MDRT 307 位；2025 目標保費 37 億、業務 3,000 人',
  },
  'leishan': {
    name: '磊山保經', short: '磊山', icon: '🪨', type: 'broker',
    contract: '承攬制（雙制度：系統制＋事業部制）', benefits: '自行投保（職業工會）',
    marketShare: '2024 實收保費 83.8 億（YoY +86%）',
    lastVerified: '2026-04-01',
    dataSources: {
      marketShare: '鉅亨網 2025/1：2024 實收保費 83.8 億、佣金成長 4 成（連續 4 年）',
      commRate: '業界中位數推估＋2024 增員說明會',
      system: '經濟日報 2026/3：業界唯一雙制度（系統制＋事業部制）相互融合',
    },
    defaults: {
      insurance: { commRateTrad: 22, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 22, fixedSalary: 0 },
      manager:   { commRateTrad: 28, orgAllowance: 0, mgrRenewal: 0 },
      medical:   { commRateTrad: 22 },
      newbie:    { commRateTrad: 20 },
    },
    brokerDefaults: { brokerComm: 38, renewalRate: 4.5, orgRate: 3, deskFee: 3500, fybDiscount: 0.8 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '分階段模組化培訓＋數據輔導工具＋實戰模擬',
      brand: '2024 實收保費 83.8 億（YoY +86%）、IDA 200+人',
      orgDev: '雙制度（系統制＋事業部制）可並行選擇，2025 目標 2,000 人',
    },
    note: '業界唯一雙制度融合；2024 新增近 500 人；2025 目標保費 120 億、新增保額 2,500 億',
  },
  'dinglv': {
    name: '錠嵂保經', short: '錠嵂', icon: '💎', type: 'broker',
    contract: '承攬制（來佣不打折、佣金表不後製）', benefits: '自行投保（職業工會）',
    marketShare: '網路口碑領先品牌',
    lastVerified: '2026-04-01',
    dataSources: {
      marketShare: '2024 保險經紀人公會統計',
      commRate: '錠嵂官網＋業務成長營公開資料：來佣全發、7-20 年服務津貼',
      system: '中央社 2025/2：2025 目標 300 位藍鵲企業家、40+ 區經理',
    },
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 20, fixedSalary: 0 },
      manager:   { commRateTrad: 26, orgAllowance: 0, mgrRenewal: 0 },
      medical:   { commRateTrad: 20 },
      newbie:    { commRateTrad: 18 },
    },
    brokerDefaults: { brokerComm: 36, renewalRate: 4, orgRate: 2.5, deskFee: 0, fybDiscount: 0.8 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '職階只升不降、不綁出勤',
      training: '網路口碑佳、保險平台整合查詢',
      brand: '網路聲量高、行動理賠聯盟鏈',
      orgDev: '組織利益終身制（底下組員首續佣一輩子相關）、無桌費無考核',
    },
    note: '來佣全發＋佣金表不後製＋7-20 年服務津貼；無強制出勤、無桌費',
  },
  'dacheng': {
    name: '大誠保經', short: '大誠', icon: '🏆', type: 'broker',
    contract: '承攬制（開放事業體制度）', benefits: '自行投保（職業工會）',
    marketShare: '全台最大保經（2024 業務 7,700 人 / 保費 220 億）',
    lastVerified: '2026-04-01',
    dataSources: {
      marketShare: '經濟日報 2025/1：2024 產壽險保費 220 億、業務 7,700 人、連續 5 年全國第一',
      commRate: '業界估計中位數＋大誠官網「優於業界佣金給付」說明',
      system: '中央社 2025/3：夢想飛翔計畫、夫妻同階同職、終身合約、世襲合約',
    },
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 20, fixedSalary: 0 },
      manager:   { commRateTrad: 26, orgAllowance: 0, mgrRenewal: 0 },
      medical:   { commRateTrad: 20 },
      newbie:    { commRateTrad: 18 },
    },
    brokerDefaults: { brokerComm: 36, renewalRate: 4, orgRate: 2.5, deskFee: 3000, fybDiscount: 0.8 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '企業通路強、集體經營利潤共享',
      brand: '連續 5 年全國最大保經、百億保經',
      orgDev: '開放事業體制度＋夫妻同階＋終身合約＋世襲合約，2025 目標破萬人',
    },
    note: '全台最大保經（7,700人）；2024 保費 220 億；2025 目標保費 300 億、業務破萬人',
  },
  'other-broker': {
    name: '其他保經', short: '其他', icon: '📋', type: 'broker',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '—',
    lastVerified: '2026-03-30',
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 20, fixedSalary: 0 },
      manager:   { commRateTrad: 25, orgAllowance: 0, mgrRenewal: 0 },
      medical:   { commRateTrad: 20 },
      newbie:    { commRateTrad: 18 },
    },
    brokerDefaults: { brokerComm: 35, renewalRate: 4, orgRate: 2, deskFee: 3000, fybDiscount: 0.8 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '—',
      brand: '—',
      orgDev: '—',
    },
    note: '手動輸入實際數值',
  },

  // ═══ 自訂 ═══
  'custom': {
    name: '自訂公司', short: '自訂', icon: '✏️', type: 'custom',
    contract: '—', benefits: '—',
    marketShare: '—',
    lastVerified: '—',
    defaults: {
      insurance: { commRateTrad: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { commRateTrad: 8, fixedSalary: 800000 },
      manager:   { commRateTrad: 22, orgAllowance: 800000, mgrRenewal: 200000 },
      medical:   { commRateTrad: 15 },
      newbie:    { commRateTrad: 18 },
    },
    comparison: {
      productChoice: '—',
      ceiling: '—',
      training: '—',
      brand: '—',
      orgDev: '—',
    },
    note: '所有欄位手動輸入',
  },
};

// ═══ 共用收入計算函式 ═══
// company-selector.js 和 income-chart.js 都會呼叫，避免公式分散兩處
// params: { commRate(%), renewalRate(%), renewalDecay(0-1), baseFYP(NT$), years(int), orgAllowance(NT$, optional) }
// 回傳: [{ year, annual, cumulative }]
function calcIncomeShared(params) {
  const commRate = Math.max(0, Math.min(100, Number(params.commRate) || 0));
  const renewalRate = Math.max(0, Math.min(100, Number(params.renewalRate) || 0));
  const renewalDecay = Math.max(0, Math.min(1, Number(params.renewalDecay) || 0));
  const baseFYP = Math.max(0, Number(params.baseFYP) || 1000000);
  const years = Math.max(1, Math.min(30, Number(params.years) || 10));
  const orgAllowance = Math.max(0, Number(params.orgAllowance) || 0);

  const result = [];
  let cumulative = 0;
  for (let y = 1; y <= years; y++) {
    let annual = baseFYP * (commRate / 100);
    for (let prev = 1; prev < y; prev++) {
      annual += baseFYP * (renewalRate / 100) * Math.pow(renewalDecay, y - prev - 1);
    }
    if (orgAllowance > 0) annual += orgAllowance;
    cumulative += annual;
    result.push({ year: y, annual: Math.round(annual), cumulative: Math.round(cumulative) });
  }
  return result;
}

// 全站數據免責聲明與來源總表
const DATA_DISCLAIMER = {
  lastUpdated: '2026-04-01',
  disclaimer: '本站數值均來自公開資訊整理，為代表性中位數估計值，僅供參考比較用途，不構成任何承諾或保證。實際佣金因商品類別、繳費年期、職級等因素有巨大差異，請依各公司最新公告為準。',
  primarySources: [
    '壽險公會 2024 年度統計年報',
    '保險經紀人公會 2024 年度統計',
    '國泰人壽業務員支給暨管理辦法 11313V2',
    '富邦人壽同仁手冊(菁英版-行銷專員CA) 1120630修改版',
    '富邦人壽同仁手冊(菁英版-通則) 1131212修訂',
    '安聯人壽業務規則 2022/12/21修訂',
    '安聯佣金表',
    '台新佣金表 113年11月04日修訂',
    '各公司官網公開招募/增員資訊（2024–2025）',
    '鉅亨網/經濟日報/中央社 2025 各保經公司業績新聞稿',
    '錠嵂官網＋業務成長營公開資料',
    '中華徵信所千大企業排名',
  ],
};
