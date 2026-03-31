# 公司篩選與制度對照 — 整合指南

## 檔案清單

```
mdrt-bps-company-filter/
├── companies.js              # 公司資料庫（4 壽險 + 4 保經 + 自訂）+ 數據來源
├── company-selector.js       # 篩選器 UI 邏輯（自動注入 DOM）
├── company-selector.css      # 篩選器樣式（v1 深色主題）
├── company-selector-v2.css   # 篩選器樣式（v2 亮色玻璃擬態）
├── income-chart.js           # 十年累計收入差距動畫圖表
├── income-chart.css          # 圖表樣式（自動適配深色/亮色）
└── INTEGRATION.md            # 本文件
```

## 整合步驟（3 步完成）

### Step 1：複製檔案到 repo

把所有 JS/CSS 檔案放入 `mdrt-bps/` 根目錄（與 `index.html` 同層）。

### Step 2：在 index.html 的 `</body>` 前加入

打開 `index.html`，找到最底部的 `</body>` 標籤，在它**之前**加入：

```html
<!-- Company Selector Module -->
<link rel="stylesheet" href="company-selector-v2.css">
<link rel="stylesheet" href="income-chart.css">
<script src="companies.js"></script>
<script src="company-selector.js"></script>
<script src="income-chart.js"></script>
```

> **注意載入順序**：必須放在原本內嵌 `<script>` **之後**，因為模組依賴原始腳本中的 `CID`、`recalc()`、`g()` 等全域函式。
>
> 如果使用深色主題，把 `company-selector-v2.css` 換成 `company-selector.css`。

### Step 3：Push 到 GitHub

```bash
cd mdrt-bps
git add companies.js company-selector.js company-selector-v2.css income-chart.js income-chart.css index.html
git commit -m "feat: P0+P1 更新 — 中性配色、數據來源、手機卡片佈局、十年收入圖表、組織發展維度"
git push
```

---

## 功能說明

### 模組一覽

| 模組 | 功能 | 自動注入 |
|------|------|---------|
| Company Selector | 公司選擇 Chip + 制度對照表（8 維度） | 插入 .id-bar 下方 |
| Income Chart | 十年累計收入差距動畫橫條圖 | 插入對照表下方 |

### 制度對照維度（8 項）

1. 合約制度
2. 首年佣金率（依身份別動態）
3. 產品選擇
4. 收入天花板
5. 勞健保
6. 培訓體系
7. **組織發展支援**（P1 新增）
8. 品牌特色

### 參數對照表
| 身份別 | 自動填入的欄位 |
|--------|---------------|
| 保險同業 | 首佣率 (`i_rate_trad`)、續佣遞減 (`i_ry_decay`) |
| 銀行理專 | 銀行佣金率 (`b_rate_trad`)、固定薪資 (`b_salary`) |
| 壽險主管 | 個人首佣 (`m_rate_trad`)、組織津貼 (`m_org_bonus`)、續期佣金 (`m_ry_sunk`) |
| 醫療通路 | 現有佣金率 (`md_rate_trad`) |
| 新人培育 | 傳統公司佣金率 (`n_rate_trad`) |

### API（進階用法）
```javascript
// 公司選擇器
CompanySelector.getSelected()        // 取得目前選擇的公司物件
CompanySelector.setCompany('nanshan-life')  // 程式切換公司
CompanySelector.getSelectedId()      // 取得選擇的公司 ID

// 收入圖表
IncomeChart.refresh()                // 手動重新渲染圖表
```

---

## 新增公司

編輯 `companies.js`，在 `COMPANY_DB` 物件中加入新條目：

```javascript
'new-company-id': {
  name: '新公司名稱', short: '簡稱', type: 'life', // life | broker | custom
  contract: '合約制度', benefits: '福利說明',
  marketShare: '市占率',
  dataSources: {
    marketShare: '來源說明',
    commRate: '來源說明',
  },
  defaults: {
    insurance: { commRate: 20, renewalRate: 3, renewalDecay: 0.6, orgAllowance: 0 },
    // ...其他身份別
  },
  comparison: {
    productChoice: '...', ceiling: '...', training: '...',
    orgDev: '組織發展支援說明', brand: '...',
  },
  note: '備註說明',
},
```

不需要改動任何其他檔案。

---

## CSS 變數依賴

v1 深色主題使用以下 CSS 變數（從原始 index.html 繼承）：

| 變數 | 用途 | Fallback |
|------|------|----------|
| `--gold` | 標題、金色強調 | `#C9A84C` |
| `--bg-card` | 卡片背景 | `#1e2a3a` |
| `--text` | 主要文字 | `#ecf0f1` |
| `--text-muted` | 次要文字 | `#95a5a6` |

v2 亮色主題不依賴 CSS 變數。Income Chart 自動偵測 `data-theme="dark"` 或 `.dark` class 切換配色。

---

## 安全建議

在 `index.html` 的 `<head>` 中加入 CSP（Content Security Policy）meta tag：

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

---

## 更新日誌

- **2026-03-30 P0**: 輸入邊界值驗證（commRate/renewalDecay clamp）
- **2026-03-30 P1**: 共用 calcIncomeShared() 函式、deploy.sh 安全化
- **2026-03-30 P2**: XSS 防護 _esc()、Tooltip tap-to-toggle、推演錨點連結
- **2026-03-30 P3**: .gitignore、JSDoc typedef、CSP 建議、WCAG 對比度
- **2026-03-29 P0**: 數據來源標註、配色中立化（藍/灰）、手機卡片佈局、離線 PDF
- **2026-03-29 P1**: 十年收入差距圖表、組織發展支援維度、免責聲明 footer
