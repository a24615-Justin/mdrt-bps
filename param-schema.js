// ─── PARAM_SCHEMA v3.0 ───────────────────────────────────────────────────────
// 唯一真相來源：所有輸入欄位的定義、渲染、收集均由此 schema 驅動
// 新增欄位：只需在此加一條 → UI 自動出現 → 值自動收集
// 最後更新：2026-04-01

/**
 * @typedef {Object} PersonaConfig
 * @property {number} [default]    - 覆寫該身份的預設值
 * @property {number} [min]        - slider min
 * @property {number} [max]        - slider max
 * @property {number} [step]       - slider step
 * @property {string} [label]      - 覆寫 label
 * @property {string} [labelSuffix]- slider 顯示後綴
 * @property {number} [divisor]    - L 換算除數（adaptMonths 專用）
 * @property {number} [maxL]       - L 換算上限（adaptMonths 專用）
 */

/**
 * @typedef {Object} ParamDef
 * @property {string} key          - 統一命名（schemaKey）
 * @property {string} label        - 顯示名稱
 * @property {string} section      - 'current' | 'risk' | 'advantage'
 * @property {string} type         - 'currency' | 'percent' | 'number' | 'slider'
 * @property {number} default      - 預設值
 * @property {string[]} personas   - 適用身份 ['ins','banker','mgr','med','new']
 * @property {'always'|'advanced'|'hidden'} visibility
 * @property {boolean} companyOverride - 公司可覆寫
 * @property {boolean} [requiresVerification] - 顯示「請與對方核實」
 * @property {string} [description]- 欄位說明（禁止處方性語言）
 * @property {string} [prefix]     - 輸入前綴（如 'NT$'）
 * @property {string} [suffix]     - 輸入後綴（如 '%'）
 * @property {number} [min]        - 最小值
 * @property {number} [max]        - 最大值
 * @property {number} [step]       - 步進
 * @property {Object.<string, PersonaConfig>} [personaConfig] - 身份別覆寫
 */

/** @type {ParamDef[]} */
const PARAM_SCHEMA = [
  // ═══ Section A — 現狀盤點 (current) ═══
  {
    key: 'fyp', label: '年化保費 FYP', section: 'current',
    type: 'currency', default: 3000000, prefix: 'NT$',
    personas: ['ins', 'mgr'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '過去一年的年化保費總額，含新契約和續期保費。',
  },
  {
    key: 'commRateTrad', label: '傳統公司首年佣金率', section: 'current',
    type: 'percent', default: 20, suffix: '%',
    min: 0, max: 100,
    personas: ['ins', 'banker', 'mgr', 'med', 'new'], visibility: 'always',
    companyOverride: true, requiresVerification: true,
    description: '現職公司給付的首年佣金比率。實際依個人職階與年資而異。',
    personaConfig: {
      banker: { default: 8, description: '銀行給付的保費佣金比率，通常為保經公司的 1/4 ~ 1/5。' },
    },
  },
  {
    key: 'renewalIncome', label: '年度續期佣金', section: 'current',
    type: 'currency', default: 500000, prefix: 'NT$',
    personas: ['ins', 'mgr'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '每年從過往保單收到的續期佣金。轉職後此收入歸零（沉沒成本）。',
    personaConfig: {
      mgr: { default: 200000, label: '個人續期佣金', description: '主管個人端的年度續期佣金收入。' },
    },
  },
  {
    key: 'renewalDecay', label: '續佣年遞減係數', section: 'current',
    type: 'number', default: 0.6,
    min: 0, max: 1, step: 0.05,
    personas: ['ins'], visibility: 'advanced',
    companyOverride: true, requiresVerification: false,
    description: '續佣每年衰減的比例係數（0-1），數值越高代表續佣衰減越慢。',
  },
  {
    key: 'bankFyp', label: '年度銷售保費', section: 'current',
    type: 'currency', default: 5000000, prefix: 'NT$',
    personas: ['banker'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '在銀行通路年度銷售的保險保費總額。',
  },
  {
    key: 'fixedSalary', label: '年度固定薪資', section: 'current',
    type: 'currency', default: 800000, prefix: 'NT$',
    personas: ['banker'], visibility: 'always',
    companyOverride: true, requiresVerification: false,
    description: '銀行支付的年度固定薪資（含底薪+固定津貼）。轉職後此收入歸零。',
  },
  {
    key: 'clientAum', label: '客戶 AUM 規模', section: 'current',
    type: 'currency', default: 50000000, prefix: 'NT$',
    personas: ['banker'], visibility: 'advanced',
    companyOverride: false, requiresVerification: false,
    description: '管理的客戶資產總規模，用於估算可轉移的客戶價值。',
  },
  {
    key: 'conversionRate', label: '客戶轉換率', section: 'current',
    type: 'percent', default: 40, suffix: '%',
    min: 0, max: 100,
    personas: ['banker'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '預估離開銀行後願意跟隨的客戶比例。',
  },
  {
    key: 'orgAllowance', label: '年度組織津貼', section: 'current',
    type: 'currency', default: 1200000, prefix: 'NT$',
    personas: ['mgr'], visibility: 'always',
    companyOverride: true, requiresVerification: true,
    description: '每年從組織制度獲得的管理津貼。轉職後此收入歸零（沉沒成本）。',
  },
  {
    key: 'teamSize', label: '現有組織人數', section: 'current',
    type: 'number', default: 15, min: 0, max: 200,
    personas: ['mgr'], visibility: 'advanced',
    companyOverride: false, requiresVerification: false,
    description: '目前帶領的團隊總人數。',
  },
  {
    key: 'followCount', label: '預估跟隨轉職人數', section: 'current',
    type: 'number', default: 6, min: 0, max: 100,
    personas: ['mgr'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '預估願意跟隨轉職的核心夥伴人數。此人數影響增員獎金計算。',
  },
  {
    key: 'medIncome', label: '年度醫療收入', section: 'current',
    type: 'currency', default: 1800000, prefix: 'NT$',
    personas: ['med'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '目前醫療通路的年度收入。轉職後此收入歸零（沉沒成本）。',
  },
  {
    key: 'referralClients', label: '轉介客戶數/年', section: 'current',
    type: 'number', default: 80, min: 0,
    personas: ['med'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '每年可轉介的客戶數量，影響 FYP 的計算基數。',
  },
  {
    key: 'avgPremium', label: '平均客戶保費', section: 'current',
    type: 'currency', default: 150000, prefix: 'NT$',
    personas: ['med'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '每位客戶的平均年化保費，與客戶數相乘得出 FYP。',
  },
  {
    key: 'newbieFyp', label: '預估第一年 FYP', section: 'current',
    type: 'currency', default: 1200000, prefix: 'NT$',
    personas: ['new'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '估計入行第一年能達成的年化保費總額，後續每年以成長率複利累積。',
  },
  {
    key: 'growthRate', label: '每年業績成長率', section: 'current',
    type: 'percent', default: 20, suffix: '%',
    min: 0, max: 100,
    personas: ['new'], visibility: 'always',
    companyOverride: false, requiresVerification: false,
    description: '預估每年業績成長的比率，影響 5 年複利試算的累積差距。',
  },
  {
    key: 'fybCoeff', label: 'FYB 制度係數', section: 'current',
    type: 'number', default: 1.0,
    min: 0.3, max: 1, step: 0.05, suffix: 'FYB',
    personas: ['new'], visibility: 'advanced',
    companyOverride: false, requiresVerification: false,
    description: '首年度佣金制度調整係數，數值越低代表首年佣金折減越多。',
  },

  // ═══ Section B — 轉職風險係數 (risk) ═══
  {
    key: 'lossRate', label: '客戶流失率', section: 'risk',
    type: 'slider', default: 15, suffix: '%',
    min: 5, max: 40, step: 1,
    personas: ['ins'], visibility: 'always',
    companyOverride: false,
    description: '轉職後預估的客戶流失比例。L 換算：L = lossRate / 100。',
    // L 計算：直接 lossRate / 100
  },
  {
    key: 'adaptMonths', label: '適應期', section: 'risk',
    type: 'slider', default: 6,
    min: 1, max: 24, step: 1,
    personas: ['banker', 'mgr', 'med', 'new'], visibility: 'always',
    companyOverride: false,
    description: '轉職後需要的適應/陣痛期月數，影響客戶流失率 L 的計算。',
    personaConfig: {
      banker:  { default: 6,  min: 3,  max: 18, label: '適應期（月）', divisor: 24, maxL: 0.9 },
      mgr:     { default: 9,  min: 3,  max: 24, label: '陣痛期（月）', divisor: 36, maxL: 0.8 },
      med:     { default: 6,  min: 2,  max: 12, label: '建立期（月）', divisor: 18, maxL: 0.7 },
      new:     { default: 3,  min: 1,  max: 9,  label: '空窗期（月）', divisor: 12, maxL: 0.5 },
    },
    // L 計算：Math.min(adapt / divisor, maxL)
  },
  {
    key: 'transitionSubsidy', label: '過渡期底薪補貼', section: 'risk',
    type: 'currency', default: 480000, prefix: 'NT$',
    personas: ['banker'], visibility: 'always',
    companyOverride: false,
    description: '保經公司提供的第一年底薪支援，用於抵銷適應期的收入缺口。直接加入第 1 年保經收入。',
  },
  {
    key: 'legalReserve', label: '法律顧問預備金', section: 'risk',
    type: 'currency', default: 200000, prefix: 'NT$',
    personas: ['mgr'], visibility: 'always',
    companyOverride: false,
    description: '轉職可能涉及的法律費用預備金，於第 1 年保經收入中扣除。',
  },

  // ═══ Section C — 保經優勢 (advantage) ═══
  {
    key: 'brokerCommRate', label: '保經首年佣金率', section: 'advantage',
    type: 'percent', default: 40, suffix: '%',
    min: 0, max: 100,
    personas: ['ins', 'banker', 'mgr', 'med', 'new'], visibility: 'always',
    companyOverride: false,
    description: '加入保經公司後的首年佣金比率。',
  },
  {
    key: 'brokerRenewalRate', label: '保經續期佣金率', section: 'advantage',
    type: 'percent', default: 5, suffix: '%',
    min: 0, max: 30,
    personas: ['ins', 'banker', 'mgr', 'med', 'new'], visibility: 'always',
    companyOverride: false,
    description: '保經公司的續期佣金比率，每年從續期保費中獲得。',
  },
  {
    key: 'orgBonusRate', label: '組織代數獎金率', section: 'advantage',
    type: 'percent', default: 3, suffix: '%',
    min: 0, max: 20,
    personas: ['ins', 'mgr'], visibility: 'always',
    companyOverride: false,
    description: '增員組織的代數獎金比率，依增員人數和其業績計算。',
  },
  {
    key: 'recruitCount', label: '增員人數', section: 'advantage',
    type: 'number', default: 3, min: 0, max: 50,
    personas: ['ins', 'mgr'], visibility: 'always',
    companyOverride: false,
    description: '預計增員的人數，影響組織獎金的計算。',
  },
  {
    key: 'recruitAvgFyp', label: '增員平均 FYP', section: 'advantage',
    type: 'currency', default: 1500000, prefix: 'NT$',
    personas: ['ins', 'mgr'], visibility: 'always',
    companyOverride: false,
    description: '每位增員夥伴的預估年化保費。組織獎金 = 增員人數 × 此數字 × 獎金率。',
  },

  // ═══ v3.0.2 新增：離職後續佣年數 ═══
  {
    key: 'postResignRenewalYrs', label: '離職後續佣年數', section: 'current',
    type: 'number', default: 0, min: 0, max: 5, step: 1,
    personas: ['ins', 'mgr'], visibility: 'advanced',
    companyOverride: true, requiresVerification: true,
    description: '離職後仍可領取續佣的年數（0-5年）。部分公司會在離職後繼續發放 2-5 年的續佣。設為 0 表示離職即歸零。',
  },

  // ═══ v3.0.1 新增：可信度強化欄位 ═══
  {
    key: 'tradGrowthRate', label: '傳統端年成長率', section: 'current',
    type: 'percent', default: 0, suffix: '%',
    min: 0, max: 30, step: 1,
    personas: ['ins', 'banker', 'mgr', 'med'], visibility: 'advanced',
    companyOverride: false, requiresVerification: false,
    description: '在傳統公司每年 FYP 的預估成長率。設為 0 表示維持不變（保守估計）。',
  },
  {
    key: 'fypShrink', label: '保費轉移係數', section: 'risk',
    type: 'slider', default: 80, suffix: '%',
    min: 50, max: 100, step: 5,
    personas: ['banker'], visibility: 'advanced',
    companyOverride: false, requiresVerification: false,
    description: '客戶跟隨轉職後，實際轉移的保費占原保費的比例。80% 表示每 100 萬只帶走 80 萬。',
  },

  // ═══ 預留擴充（visibility: 'hidden'，v3.0 暫不渲染） ═══
  {
    key: 'performanceBonus', label: '年度績效獎金', section: 'current',
    type: 'currency', default: 0, prefix: 'NT$',
    personas: ['ins', 'banker', 'mgr'], visibility: 'hidden',
    companyOverride: false,
    description: '傳統端每季或每年的績效獎金。',
  },
  {
    key: 'nonCompeteMonths', label: '競業禁止期限', section: 'risk',
    type: 'slider', default: 0, min: 0, max: 24, step: 1,
    personas: ['ins', 'mgr'], visibility: 'hidden',
    companyOverride: false,
    description: '競業條款限制的月數，影響轉職時間規劃。',
  },
  {
    key: 'trainingStipend', label: '培訓津貼', section: 'risk',
    type: 'currency', default: 0, prefix: 'NT$',
    personas: ['new'], visibility: 'hidden',
    companyOverride: false,
    description: '保經新人前 6 個月的培訓津貼。',
  },
  {
    key: 'secondGenRenewal', label: '二代續佣率', section: 'advantage',
    type: 'percent', default: 0, suffix: '%',
    personas: ['ins', 'mgr'], visibility: 'hidden',
    companyOverride: false,
    description: '客戶轉介帶來的續佣比率。',
  },
  {
    key: 'benefitsValue', label: '福利年度價值', section: 'current',
    type: 'currency', default: 0, prefix: 'NT$',
    personas: ['banker'], visibility: 'hidden',
    companyOverride: false,
    description: '團保+福利的隱形年度價值。',
  },
  {
    key: 'retirementPenalty', label: '退職金損失', section: 'current',
    type: 'currency', default: 0, prefix: 'NT$',
    personas: ['mgr'], visibility: 'hidden',
    companyOverride: false,
    description: '離職將喪失的退職金總額。',
  },
];

// ─── Persona short ID mapping ───
const PERSONA_IDS = {
  insurance: 'ins', banker: 'banker', manager: 'mgr', medical: 'med', newbie: 'new',
};

// ─── XSS sanitizer ───
function _esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ─── Helper: get param def with persona config merged ───
function getParamDef(paramDef, personaShort) {
  const pc = paramDef.personaConfig && paramDef.personaConfig[personaShort];
  if (!pc) return paramDef;
  return { ...paramDef, ...pc, _baseDefault: paramDef.default };
}

// ─── renderInputs(persona): PARAM_SCHEMA → DOM ───
// Renders input fields into #inputs-container, grouped by section
function renderInputs(personaId) {
  const personaShort = PERSONA_IDS[personaId];
  const container = document.getElementById('inputs-container');
  if (!container) return;

  const sections = { current: [], risk: [], advantage: [] };
  const sectionLabels = {
    current: 'A. 現狀盤點',
    risk: 'B. 轉職風險係數',
    advantage: 'C. 保經優勢',
  };

  // Filter and group
  PARAM_SCHEMA.forEach(param => {
    if (!param.personas.includes(personaShort)) return;
    if (param.visibility === 'hidden') return;
    const merged = getParamDef(param, personaShort);
    sections[param.section].push(merged);
  });

  let html = '';
  for (const [sectionKey, fields] of Object.entries(sections)) {
    if (fields.length === 0) continue;

    const alwaysFields = fields.filter(f => f.visibility === 'always');
    const advancedFields = fields.filter(f => f.visibility === 'advanced');

    html += `<div class="param-section">`;
    html += `<div class="param-section-label">${_esc(sectionLabels[sectionKey])}</div>`;

    // Always-visible fields
    html += `<div class="param-fields">`;
    alwaysFields.forEach(f => { html += renderField(f, personaId); });
    html += `</div>`;

    // Advanced fields (collapsible)
    if (advancedFields.length > 0) {
      html += `<details class="advanced-toggle"><summary>更多選項（${advancedFields.length} 項）</summary>`;
      html += `<div class="param-fields">`;
      advancedFields.forEach(f => { html += renderField(f, personaId); });
      html += `</div></details>`;
    }

    html += `</div>`;
  }

  container.innerHTML = html;

  // Attach event listeners for recalc
  container.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', handleInputChange);
  });
}

// ─── Render single field HTML ───
function renderField(param, personaId) {
  const inputId = `param_${param.key}`;
  const val = getCurrentValue(param.key, personaId) ?? param.default;
  const verifyBadge = param.requiresVerification
    ? '<span class="verify-badge" title="此數值因人而異，面談時請與對方確認">⚠️ 請與對方核實</span>'
    : '';
  const modifiedBadge = isUserModified(param.key)
    ? '<span class="modified-badge">✏️ 已手動調整</span>'
    : '';

  let inputHtml = '';
  if (param.type === 'slider') {
    const min = param.min || 0;
    const max = param.max || 100;
    const step = param.step || 1;
    const suffix = param.suffix || '';
    inputHtml = `
      <div class="slider-wrap">
        <div class="slider-value" id="${inputId}_display">${val}${_esc(suffix)}</div>
        <input type="range" id="${inputId}" data-key="${_esc(param.key)}"
          min="${min}" max="${max}" step="${step}" value="${val}"
          oninput="document.getElementById('${inputId}_display').textContent=this.value+'${_esc(suffix)}'">
      </div>`;
  } else {
    const prefix = param.prefix ? `<span class="prefix">${_esc(param.prefix)}</span>` : '';
    const suffix = param.suffix ? `<span class="suffix">${_esc(param.suffix)}</span>` : '';
    const cls = [];
    if (!param.prefix) cls.push('no-prefix');
    if (param.suffix) cls.push('has-suffix');
    const min = param.min != null ? ` min="${param.min}"` : '';
    const max = param.max != null ? ` max="${param.max}"` : '';
    const step = param.step != null ? ` step="${param.step}"` : '';
    inputHtml = `
      <div class="input-wrap">
        ${prefix}
        <input type="number" id="${inputId}" data-key="${_esc(param.key)}"
          class="${cls.join(' ')}" value="${val}"${min}${max}${step}>
        ${suffix}
      </div>`;
  }

  const desc = param.description
    ? `<div class="field-desc">${_esc(param.description)}</div>`
    : '';

  return `
    <div class="field" data-key="${_esc(param.key)}">
      <label for="${inputId}">${_esc(param.label)} ${verifyBadge} ${modifiedBadge}</label>
      ${inputHtml}
      ${desc}
      <div class="field-warning" id="${inputId}_warning" style="display:none"></div>
    </div>`;
}

// ─── collectInputs(): PARAM_SCHEMA → values object ───
// Returns { schemaKey: value, ... } for the current persona
function collectInputs(personaId) {
  const personaShort = PERSONA_IDS[personaId];
  const values = {};

  PARAM_SCHEMA.forEach(param => {
    if (!param.personas.includes(personaShort)) return;
    if (param.visibility === 'hidden') return;

    const inputId = `param_${param.key}`;
    const el = document.getElementById(inputId);
    const merged = getParamDef(param, personaShort);

    if (el) {
      values[param.key] = parseFloat(el.value) || 0;
    } else {
      values[param.key] = merged.default;
    }
  });

  return values;
}

// ─── Convert collectInputs output → compute5yr params ───
// Bridges the schema keys to the compute5yr(p) parameter format
// v3.0.1: 新增 broker_ry_decay / tradGrowth / attrition / fypShrink
function schemaToComputeParams(values, personaId) {
  const personaShort = PERSONA_IDS[personaId];
  const rb = (values.brokerCommRate ?? 40) / 100;
  const ryr = (values.brokerRenewalRate ?? 5) / 100;
  const or_ = (values.orgBonusRate ?? 0) / 100;

  // Get adaptMonths config
  const adaptParam = PARAM_SCHEMA.find(p => p.key === 'adaptMonths');
  const adaptConfig = adaptParam?.personaConfig?.[personaShort] || {};

  // v3.0.1: 保經端續佣遞減從 COMPANY_DB['gongsheng'] 動態讀取
  const gsBrokerDecay = (typeof COMPANY_DB !== 'undefined' && COMPANY_DB['gongsheng'])
    ? (COMPANY_DB['gongsheng'].renewalDecay ?? 0.85) : 0.85;

  if (personaId === 'insurance') {
    return {
      FYP: values.fyp ?? 3000000,
      rate_trad: (values.commRateTrad ?? 20) / 100,
      ry_sunk: values.renewalIncome ?? 500000,
      ry_decay: values.renewalDecay ?? 0.6,
      broker_ry_decay: gsBrokerDecay,
      tradGrowth: (values.tradGrowthRate ?? 0) / 100,
      postResignYrs: values.postResignRenewalYrs ?? 0,
      L: (values.lossRate ?? 15) / 100,
      rb, ryr, or_,
      nrec: values.recruitCount ?? 0,
      rfyp: values.recruitAvgFyp ?? 0,
      fyb: 1,
    };
  }
  if (personaId === 'banker') {
    const rawFYP = values.bankFyp ?? 5000000;
    const conv = (values.conversionRate ?? 40) / 100;
    const adapt = values.adaptMonths ?? (adaptConfig.default ?? 6);
    const divisor = adaptConfig.divisor || 24;
    const maxL = adaptConfig.maxL || 0.9;
    return {
      FYP: rawFYP * conv,
      rate_trad: (values.commRateTrad ?? 8) / 100,
      ry_sunk: values.fixedSalary ?? 800000,
      ry_decay: 0.6,
      broker_ry_decay: gsBrokerDecay,
      tradGrowth: (values.tradGrowthRate ?? 0) / 100,
      fypShrink: (values.fypShrink ?? 80) / 100,
      L: Math.min(adapt / divisor, maxL),
      rb, ryr, or_: 0, nrec: 0, rfyp: 0, fyb: 1,
      _rawFYP: rawFYP, _conv: conv, _aum: values.clientAum ?? 0,
      _subsidy: values.transitionSubsidy ?? 0,
      _adapt: adapt, _id: 'banker',
    };
  }
  if (personaId === 'manager') {
    const FYP = values.fyp ?? 3000000;
    const follow = values.followCount ?? 0;
    const adapt = values.adaptMonths ?? (adaptConfig.default ?? 9);
    const divisor = adaptConfig.divisor || 36;
    const maxL = adaptConfig.maxL || 0.8;
    return {
      FYP,
      rate_trad: (values.commRateTrad ?? 20) / 100,
      ry_sunk: values.orgAllowance ?? 0,
      _mRySunk: values.renewalIncome ?? 0,
      ry_decay: 0.6,
      broker_ry_decay: gsBrokerDecay,
      tradGrowth: (values.tradGrowthRate ?? 0) / 100,
      postResignYrs: values.postResignRenewalYrs ?? 0,
      L: Math.min(adapt / divisor, maxL),
      rb, ryr, or_,
      nrec: follow,
      rfyp: values.recruitAvgFyp ?? (FYP * 0.8),
      fyb: 1,
      _legal: values.legalReserve ?? 0,
      _follow: follow,
      _teamSize: values.teamSize ?? 0,
      _id: 'manager',
    };
  }
  if (personaId === 'medical') {
    const clients = values.referralClients ?? 80;
    const avgP = values.avgPremium ?? 150000;
    const FYP = clients * avgP;
    const adapt = values.adaptMonths ?? (adaptConfig.default ?? 6);
    const divisor = adaptConfig.divisor || 18;
    const maxL = adaptConfig.maxL || 0.7;
    return {
      FYP,
      rate_trad: (values.commRateTrad ?? 15) / 100,
      ry_sunk: values.medIncome ?? 1800000,
      ry_decay: 0.6,
      broker_ry_decay: gsBrokerDecay,
      tradGrowth: (values.tradGrowthRate ?? 0) / 100,
      L: Math.min(adapt / divisor, maxL),
      rb, ryr, or_: 0, nrec: 0, rfyp: 0, fyb: 1,
      _clients: clients, _avgP: avgP, _id: 'medical',
    };
  }
  if (personaId === 'newbie') {
    const FYP = values.newbieFyp ?? 1200000;
    const growth = (values.growthRate ?? 20) / 100;
    const adapt = values.adaptMonths ?? (adaptConfig.default ?? 3);
    const divisor = adaptConfig.divisor || 12;
    const maxL = adaptConfig.maxL || 0.5;
    const fyb = Math.min(1, Math.max(0.1, values.fybCoeff ?? 1));
    return {
      FYP,
      rate_trad: (values.commRateTrad ?? 18) / 100,
      ry_sunk: 0,
      ry_decay: 0.6,
      broker_ry_decay: gsBrokerDecay,
      L: Math.min(adapt / divisor, maxL),
      rb, ryr, or_: 0, nrec: 0, rfyp: 0, fyb,
      _growth: growth, _id: 'newbie',
    };
  }
  return {};
}

// ─── userModified tracking ───
const _userModified = {};

function markUserModified(key) {
  _userModified[key] = true;
}

function isUserModified(key) {
  return !!_userModified[key];
}

function clearUserModified() {
  Object.keys(_userModified).forEach(k => delete _userModified[k]);
}

function clearUserModifiedForKey(key) {
  delete _userModified[key];
}

// ─── Store/retrieve current values (for cross-identity persistence) ───
const _currentValues = {};

function setCurrentValue(key, value, personaId) {
  if (!_currentValues[personaId]) _currentValues[personaId] = {};
  _currentValues[personaId][key] = value;
}

function getCurrentValue(key, personaId) {
  return _currentValues[personaId]?.[key];
}

// ─── Handle input change (event listener) ───
function handleInputChange(e) {
  const key = e.target.dataset.key;
  if (!key) return;
  const value = parseFloat(e.target.value) || 0;

  // Check if this is a companyOverride field
  const paramDef = PARAM_SCHEMA.find(p => p.key === key);
  if (paramDef?.companyOverride) {
    markUserModified(key);
    // Update modified badge
    const fieldEl = e.target.closest('.field');
    if (fieldEl && !fieldEl.querySelector('.modified-badge')) {
      const label = fieldEl.querySelector('label');
      if (label) {
        const badge = document.createElement('span');
        badge.className = 'modified-badge';
        badge.textContent = '✏️ 已手動調整';
        label.appendChild(badge);
      }
    }
  }

  // Store value
  if (typeof currentPersonaId !== 'undefined') {
    setCurrentValue(key, value, currentPersonaId);
  }

  // Validate boundaries
  validateField(key, value, e.target);

  // Trigger recalc
  if (typeof recalc === 'function') recalc();
}

// ─── Boundary validation ───
function validateField(key, value, inputEl) {
  const warningEl = document.getElementById(`param_${key}_warning`);
  if (!warningEl) return;

  // Check COMM_RANGES if applicable
  if (key === 'commRateTrad' && typeof COMM_RANGES !== 'undefined' && typeof selectedCompanyId !== 'undefined') {
    const range = COMM_RANGES[selectedCompanyId];
    if (range && (value < range[0] || value > range[1])) {
      const companyName = typeof COMPANY_DB !== 'undefined' ? COMPANY_DB[selectedCompanyId]?.short : '';
      warningEl.textContent = `此數值超出 ${companyName} 已知範圍（${range[0]}-${range[1]}%），請確認`;
      warningEl.style.display = 'block';
      warningEl.className = 'field-warning warning-orange';
      return;
    }
  }

  // General: zero or negative check
  if (value < 0) {
    warningEl.textContent = '數值可能不合理';
    warningEl.style.display = 'block';
    warningEl.className = 'field-warning warning-orange';
    return;
  }

  // NaN check
  if (isNaN(value)) {
    warningEl.textContent = '請輸入有效數字';
    warningEl.style.display = 'block';
    warningEl.className = 'field-warning warning-red';
    return;
  }

  warningEl.style.display = 'none';
}

// ─── Apply company defaults ───
// v3.0: COMPANY_DB defaults key 已統一為 PARAM_SCHEMA schemaKey，不需 keyMap 轉換
// v3.0.1: 保經類公司的 brokerDefaults 自動填入 Section C 保經優勢欄位
function applyCompanyDefaults(companyId, personaId) {
  if (typeof COMPANY_DB === 'undefined' || !COMPANY_DB[companyId]) return;

  const company = COMPANY_DB[companyId];
  const defaults = company.defaults?.[personaId] || {};

  for (const [schemaKey, value] of Object.entries(defaults)) {
    // Skip if user has manually modified this field
    if (isUserModified(schemaKey)) continue;

    const inputEl = document.getElementById(`param_${schemaKey}`);
    if (inputEl) {
      inputEl.value = value;
      setCurrentValue(schemaKey, value, personaId);
    }
  }

  // 保經類公司：brokerDefaults → Section C 保經優勢欄位
  // 讓選擇「永達」時自動帶入永達的佣金率，而非預設的公勝 40%
  if (company.brokerDefaults) {
    const bdMap = {
      brokerComm:  'brokerCommRate',
      renewalRate: 'brokerRenewalRate',
      orgRate:     'orgBonusRate',
    };
    for (const [bdKey, schemaKey] of Object.entries(bdMap)) {
      if (isUserModified(schemaKey)) continue;
      const val = company.brokerDefaults[bdKey];
      if (val == null) continue;
      const inputEl = document.getElementById(`param_${schemaKey}`);
      if (inputEl) {
        inputEl.value = val;
        setCurrentValue(schemaKey, val, personaId);
      }
    }
  }
}
