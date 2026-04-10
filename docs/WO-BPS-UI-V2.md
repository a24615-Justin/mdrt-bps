# WO-BPS-UI-V2：增員試算工具 UI 全面重構

> **版本**：v1.0 ｜ **建立日期**：2026-04-10
> **狀態**：規格確認
> **專案**：mdrt-bps（獨立於保策通）
> **參考原型**：`lifetime-preview.html`

---

## 核心目標

將現有密集功能導向的 UI 改為**卡片式現代風格**，以 `lifetime-preview.html` 為視覺基準。
**功能邏輯全部保留**，只重構呈現層。

---

## 功能設計三問

### Q1：誰要用？用在何處？
增員主管在面談或說明會中展示。需要在**手機/平板/投影**三種場景都清楚可讀。
現有 UI 在手機上太擠、投影時字太小。

### Q2：目的與功能適配程度？
卡片式留白設計讓每個區塊視覺獨立，面談時可以一張一張滑給對方看。
現有功能（7 身份 × 15 公司 × 5 年試算 × 10 年圖表）全部保留。

### Q3：讓產品更好用，還是更複雜？
更好用。視覺層級更清楚，不需要說明「這裡是什麼」。

---

## SDD（系統設計）

### 頁面結構（新）

```
┌─ Header（sticky）
│  ├─ 標題 + QR 按鈕
│  └─ 主 Tab 切換（Tab A / Tab B）
│
├─ Tab A：為什麼做保經？
│  ├─ Card: 身份選擇（7 個 pill buttons）
│  ├─ Card: 痛點雷達圖（SVG，已有）
│  ├─ Card: 生活節奏對照（已有）
│  ├─ Card: 面談觀點卡（已有）
│  └─ CTA Bridge → Tab B
│
├─ Tab B：制度收入試算
│  ├─ Card: 身份語境提示（persona-context）
│  │
│  ├─ [保險同業/壽險主管/新人] ──────────
│  │  ├─ Card: 對照公司制度（company chips + notice + 比較表）
│  │  ├─ Card: KPI 四格（結論先行：5年差額 / 超越點 / 年均差）
│  │  ├─ Card: 年度收入對照（Chart.js grouped bar）
│  │  ├─ Card: 十年累計差距（Chart.js line，統一 compute5yr 擴展）
│  │  ├─ <details> 調整假設參數（預設收合）
│  │  │  ├─ 左欄 🏢 傳統端（公司預設 + 可調）
│  │  │  └─ 右欄 🏅 保經端（保經預設 + 可調）
│  │  └─ Card: 情境模擬（樂觀/基準/保守）
│  │
│  ├─ [銀行理專] ─── hideCompany ──────
│  │  ├─ Card: KPI 四格（結論先行）
│  │  ├─ Card: 年度/十年收入圖表
│  │  ├─ <details> 調整假設參數（雙欄：銀行通路 vs 保經）
│  │  └─ Card: 情境模擬
│  │
│  ├─ [醫療/房仲/車仲] ── crossIndustry ─
│  │  ├─ Card: 客戶池金礦試算
│  │  └─ Card: 參數設定（異業專用欄位）
│  │
│  └─ Card: 深度心理腳本（Section ③，全身份共用）
│
└─ Footer + 免責聲明
```

### 視覺規範（沿用 lifetime-preview.html）

| 元素 | 規格 |
|------|------|
| 卡片 | `background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.06)` |
| 卡片標題 | `17px; font-weight: 700; color: var(--navy)` |
| 輸入欄位 | `border: 2px solid var(--border); border-radius: 10px; padding: 10px 14px` |
| 傳統端底色 | `#fef2f2`（淡紅）+ border `#fecaca` |
| 保經端底色 | `#eff6ff`（淡藍）+ border `#bfdbfe` |
| 實際佣金率顯示 | 底部灰色提示框，即時計算 `商品 × 職級 = N%` |
| 圖表 | Chart.js 4.x — line chart（累計）+ bar chart（年度對比） |
| 免責聲明 | `font-size: 11px; background: #fefce8; border-left: 3px solid var(--gold)` |
| 字型 | Noto Serif TC + DM Mono + Outfit（已載入） |

### 參數區改為雙欄對比

> **審查修正 v1.1（2026-04-10）**
> - UX-3：KPI 四格移到參數之前（結論先行），參數用 `<details>` 可收合
> - UX-5：實際佣金率改三段式乘法鏈（FYP × 商品率 × 職級率 = N 萬）
> - CALC-4/5：Banker fixedSalary / Manager orgAllowance 獨立欄位
> - MAP-1：Banker 傳統端改為「銀行代售手續費率」單一欄位
> - MAP-2：保經端增加組織獎金區塊
> - UX-1：手機版改壓縮雙欄（僅 label+value），不堆疊
> - CALC-1：ry_decay 0.6→0.98 已修（d4ded57）
> - CALC-2：新 chart-renderer.js 統一使用 compute5yr（廢棄 income-chart.js 獨立模型）

#### 保險同業 / 壽險主管 / 新人

```
┌──────────────────────┬──────────────────────┐
│ 🏢 傳統端（紅底）      │ 🏅 保經端（藍底）      │
├──────────────────────┼──────────────────────┤
│ 商品首佣率  60%        │ 商品首佣率  60%        │
│ 個人職級率  20%        │ 個人職級率  40%        │
│ 續佣率      3%        │ 續佣率      5%        │
│ 現有續佣   50萬        │ 轉換損失   20%        │
│ [主管] 組織津貼 80萬    │ 組織獎金：3人×100萬×3% │
├──────────────────────┼──────────────────────┤
│ FYP 300萬 × 60% × 20% │ FYP 300萬 × 60% × 40% │
│ = 實際首佣 36 萬       │ = 實際首佣 72 萬       │
└──────────────────────┴──────────────────────┘
```

#### 銀行理專（hideCompany）

```
┌──────────────────────┬──────────────────────┐
│ 🏢 銀行通路（紅底）     │ 🏅 保經端（藍底）      │
├──────────────────────┼──────────────────────┤
│ 年度固定薪資  62萬      │ 商品首佣率  60%        │
│ 銀行代售手續費率  8%    │ 個人職級率  40%        │
│ 客戶轉換率  30%        │ 續佣率      5%        │
│ 福利年度價值  8萬       │ 轉換損失   20%        │
├──────────────────────┼──────────────────────┤
│ 底薪 62萬 + 佣金 N萬   │ FYP × 60% × 40%      │
│ = 年收入 N 萬          │ = 實際首佣 N 萬       │
└──────────────────────┴──────────────────────┘
```

### 圖表升級

| 現行 | 改為 |
|------|------|
| CSS 橫條（ac-wrap） | Chart.js grouped bar（年度對比） |
| CSS 橫條（income-chart.js 獨立模型） | Chart.js line chart（統一 compute5yr 擴展至 10 年） |
| 無互動 tooltip | Chart.js 原生 tooltip |

> **CALC-2 修正**：廢棄 `income-chart.js` 的獨立 `calc10YearIncome` 模型（固定 FYP 100 萬、不計算適應損失/fybDiscount/年終獎金）。新的 `chart-renderer.js` 統一使用 `compute5yr`（loop 10 次），確保 KPI 數字與圖表完全一致。

### 模組拆分（新檔案結構）

```
index.html          ← 瘦身：只留 HTML 結構 + 初始化
styles-v2.css       ← 新版卡片式樣式
ui-renderer.js      ← 卡片渲染邏輯（取代 inline HTML）
chart-renderer.js   ← Chart.js 圖表統一管理
param-schema.js     ← 不動
calculator.js       ← 不動
companies.js        ← 不動
pain-module.js      ← 微調（套用新 card class）
share.js            ← 不動
auth-gate.js        ← 不動
```

---

## 實作步驟

### Phase 1：新樣式 + 卡片容器（不動功能）
1. 建立 `styles-v2.css`，定義 card / 雙欄 / KPI / disclaimer 樣式
2. index.html 的每個 `<div class="section">` 改為 `<div class="card">`
3. 參數區從單欄改雙欄（紅藍對比）
4. 驗證：所有 7 身份切換正常、計算結果不變

### Phase 2：圖表升級
5. 建立 `chart-renderer.js`，封裝 Chart.js 圖表
6. 年度對比從 CSS 橫條改 Chart.js grouped bar
7. 十年圖從 CSS 橫條改 Chart.js line（含情境帶）
8. 移除舊 `income-chart.js` + `income-chart.css`

### Phase 3：參數拆分（雙欄紅藍）
9. 傳統端/保經端各自有商品首佣率 + 職級率 + 續佣率
10. 即時顯示「實際首佣 = FYP × N%」
11. 對應 `param-schema.js` 的 `renderInputs` 輸出改為雙欄

### Phase 4：收尾
12. pain-module.js 套用新 card class
13. 響應式調整（手機單欄、平板雙欄）
14. 分享截圖驗證
15. 全身份走查測試

---

## BDD（驗收條件）

### Scenario 1：保險同業完整流程
```gherkin
Given 選擇保險同業，公司選國泰
When 進入 Tab B
Then 顯示公司 chips + 比較表 card
And 參數區為紅藍雙欄
And 圖表為 Chart.js 互動圖
And 計算結果與舊版一致
```

### Scenario 2：銀行理專
```gherkin
Given 選擇銀行理專
When 進入 Tab B
Then 公司 chips/比較表隱藏
And 參數區仍為紅藍雙欄（左=銀行通路）
And 十年圖標籤為「銀行通路 vs 公勝」
```

### Scenario 3：異業身份
```gherkin
Given 選擇房仲/車仲/醫療
When 進入 Tab B
Then 顯示金礦試算 card
And 隱藏公司/KPI/年度對照/十年圖
```

### Scenario 4：手機響應式
```gherkin
Given viewport width = 375px
When 查看參數區
Then 紅藍雙欄變為上下堆疊
And 圖表寬度自適應
```

---

## 不做（V2 排除）

- ❌ 遠景模型整合（保留為獨立頁面 lifetime-preview.html）
- ❌ 後端 API 變更
- ❌ 新增身份或公司
- ❌ 功能邏輯變更（只改 UI 層）
