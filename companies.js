// ─── Company Data Model ──────────────────────────────────────────────────────
// 公司制度資料庫 — 所有預設數值均標註來源，供使用者查核
// 新增公司：複製任一物件，修改 id/name/defaults 即可
// lastUpdated: 2026-03-29
// dataDisclaimer: 數值為公開資訊整理，實際依個人職階與年資有所不同

const COMPANY_DB = {
  // ═══ 壽險公司 ═══
  'cathay-life': {
    name: '國泰人壽', short: '國泰', icon: '🌳', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '21.3%',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '2024 業界公開徵才資訊中位數',
      contract: '國泰人壽官網業務合作專區',
    },
    defaults: {
      insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { bankComm: 8, fixedSalary: 800000 },
      manager:   { personalComm: 22, orgAllowance: 800000, personalRenewal: 200000 },
      medical:   { currentComm: 15 },
      newbie:    { altComm: 18 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '大型品牌光環',
      orgDev: '固定晉升階梯，需達組織人力門檻',
    },
    note: '雙合約制（承攬+僱傭），提供勞健保、勞退、團險',
  },
  'fubon-life': {
    name: '富邦人壽', short: '富邦', icon: '🦁', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '14.8%',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '2024 業界公開徵才資訊中位數',
      contract: '富邦人壽官網業務招募專區',
    },
    defaults: {
      insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { bankComm: 8, fixedSalary: 850000 },
      manager:   { personalComm: 21, orgAllowance: 900000, personalRenewal: 200000 },
      medical:   { currentComm: 15 },
      newbie:    { altComm: 18 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '金融集團整合優勢',
      orgDev: '固定晉升階梯，需達組織人力門檻',
    },
    note: '金控體系，銀行保險通路強',
  },
  'nanshan-life': {
    name: '南山人壽', short: '南山', icon: '⛰️', type: 'life',
    contract: '純承攬制', benefits: '自行投保',
    marketShare: '12.4%',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '2024 業界公開徵才資訊中位數',
      contract: '南山人壽官網增員專區',
    },
    defaults: {
      insurance: { commRate: 25, renewalRate: 4, renewalDecay: 0.65, orgAllowance: 0 },
      banker:    { bankComm: 0, fixedSalary: 0 },
      manager:   { personalComm: 25, orgAllowance: 600000, personalRenewal: 250000 },
      medical:   { currentComm: 18 },
      newbie:    { altComm: 22 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受組織架構限制',
      training: '完整培訓體系',
      brand: '老牌聲譽',
      orgDev: '組織層級多，晉升路徑長',
    },
    note: '純承攬制，佣金率較高但無勞健保',
  },
  'shin-kong-life': {
    name: '新光人壽', short: '新光', icon: '✨', type: 'life',
    contract: '雙合約制', benefits: '有勞健保',
    marketShare: '7.7%',
    dataSources: {
      marketShare: '2024 壽險公會年報',
      commRate: '2024 業界公開徵才資訊中位數',
      contract: '新光人壽官網業務專區',
    },
    defaults: {
      insurance: { commRate: 19, renewalRate: 2.5, renewalDecay: 0.55, orgAllowance: 0 },
      banker:    { bankComm: 7, fixedSalary: 750000 },
      manager:   { personalComm: 20, orgAllowance: 700000, personalRenewal: 180000 },
      medical:   { currentComm: 14 },
      newbie:    { altComm: 17 },
    },
    comparison: {
      productChoice: '限自家產品',
      ceiling: '受職階與公司政策限制',
      training: '完整培訓體系',
      brand: '老牌品牌',
      orgDev: '固定晉升階梯，需達組織人力門檻',
    },
    note: '雙合約制，新人財務補助計畫',
  },

  // ═══ 保經公司（競品）═══
  'yongda': {
    name: '永達保經', short: '永達', icon: '🏛️', type: 'broker',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '保經前三',
    dataSources: {
      marketShare: '2024 保險經紀人公會統計',
      commRate: '2024 公開增員說明會資料',
    },
    defaults: {
      insurance: { commRate: 22, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      manager:   { personalComm: 22, orgAllowance: 0, personalRenewal: 0 },
      newbie:    { altComm: 22 },
    },
    brokerDefaults: { brokerComm: 38, renewalRate: 4.5, orgRate: 3 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '自主學習為主',
      brand: '上市公司、兩岸布局',
      orgDev: '增員獎金制度，晉級獎最高 310 萬',
    },
    note: '增員獎 2.4 萬/人，晉級獎最高 310 萬',
  },
  'leishan': {
    name: '磊山保經', short: '磊山', icon: '🪨', type: 'broker',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '快速成長',
    dataSources: {
      marketShare: '2024 磊山保經官方新聞稿',
      commRate: '2024 公開增員說明會資料',
    },
    defaults: {
      insurance: { commRate: 22, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      manager:   { personalComm: 22, orgAllowance: 0, personalRenewal: 0 },
      newbie:    { altComm: 22 },
    },
    brokerDefaults: { brokerComm: 38, renewalRate: 4.5, orgRate: 3 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '內部培訓完善',
      brand: '2024年保費 80 億、YoY +86%',
      orgDev: '快速擴張中，組織支援待觀察',
    },
    note: '2025 年目標保費 120 億、人力 2000 人',
  },
  'dinglv': {
    name: '錠嵂保經', short: '錠嵂', icon: '💎', type: 'broker',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '知名品牌',
    dataSources: {
      marketShare: '2024 保險經紀人公會統計',
      commRate: '業界估計中位數',
    },
    defaults: {
      insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      manager:   { personalComm: 20, orgAllowance: 0, personalRenewal: 0 },
      newbie:    { altComm: 20 },
    },
    brokerDefaults: { brokerComm: 36, renewalRate: 4, orgRate: 2.5 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '網路口碑佳',
      brand: '網路聲量高',
      orgDev: '個人品牌導向，組織支援較少',
    },
    note: '',
  },
  'dacheng': {
    name: '大誠保經', short: '大誠', icon: '🏆', type: 'broker',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '卓越評比',
    dataSources: {
      marketShare: '2024 保險經紀人公會統計',
      commRate: '業界估計中位數',
    },
    defaults: {
      insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      manager:   { personalComm: 20, orgAllowance: 0, personalRenewal: 0 },
      newbie:    { altComm: 20 },
    },
    brokerDefaults: { brokerComm: 36, renewalRate: 4, orgRate: 2.5 },
    comparison: {
      productChoice: '多家保司產品',
      ceiling: '依個人能力',
      training: '企業通路強',
      brand: '卓越保險評比得獎',
      orgDev: '企業通路為主，組織發展空間有限',
    },
    note: '',
  },
  'other-broker': {
    name: '其他保經', short: '其他', icon: '📋', type: 'broker',
    contract: '承攬制', benefits: '自行投保',
    marketShare: '—',
    defaults: {
      insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      manager:   { personalComm: 20, orgAllowance: 0, personalRenewal: 0 },
      newbie:    { altComm: 20 },
    },
    brokerDefaults: { brokerComm: 35, renewalRate: 4, orgRate: 2 },
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
    defaults: {
      insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
      banker:    { bankComm: 8, fixedSalary: 800000 },
      manager:   { personalComm: 22, orgAllowance: 800000, personalRenewal: 200000 },
      medical:   { currentComm: 15 },
      newbie:    { altComm: 18 },
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

// 公勝保經固定參數（右側對照）
const GONGSHENG_COMPARE = {
  contract: '承攬制',
  benefits: '自行投保（職業工會）',
  productChoice: '多家保司產品',
  ceiling: '無上限',
  training: 'MDRT 系統培訓',
  brand: '連續七年保經業第一',
  orgDev: '組織津貼 + 增員獎金 + 團隊培訓支援',
};

// 全站數據免責聲明與來源總表
const DATA_DISCLAIMER = {
  lastUpdated: '2026-03-29',
  disclaimer: '本站數值均來自公開資訊整理，僅供參考比較用途，不構成任何承諾或保證。實際制度依各公司最新公告為準。',
  primarySources: [
    '壽險公會 2024 年度統計年報',
    '保險經紀人公會 2024 年度統計',
    '各公司官網公開招募/增員資訊（2024–2025）',
    '公開增員說明會簡報資料',
  ],
};
