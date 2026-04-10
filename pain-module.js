/* ═══════════════════════════════════════════════════════════════════════════
   MDRT-BPS v4.0 — Pain Module (Tab A)
   渲染：雷達圖 + 生活節奏 + 收入天花板 + 觀念溝通卡片
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── renderTabA: Tab A 主入口 ─────────────────────────────────────────── */
function renderTabA(personaId) {
  var p = PERSONA_PAIN_POINTS[personaId];
  if (!p) return;
  // v4.8: 新人先鼓勵入行，再做通路比較
  var radarSectionTitle = document.querySelector('#section-a1 .section-title');
  if (radarSectionTitle) {
    radarSectionTitle.textContent = personaId === 'newbie'
      ? '如果選擇保險業，壽險 vs 保經怎麼選？'
      : '現職 vs 保經：五大關鍵差異';
  }
  // 新人專屬鼓勵區塊
  var encourageEl = document.getElementById('newbie-encourage');
  if (encourageEl) {
    encourageEl.style.display = personaId === 'newbie' ? 'block' : 'none';
  }
  renderRadar(p, personaId);
  renderDailySchedule(p);
  // renderPainIncome 已移除 — 收入天花板無數據支撐，改由 Tab B 試算
  renderPainScripts(p);
}

/* ─── A-1: 痛點雷達圖（純 SVG）──────────────────────────────────────── */
function renderRadar(p, personaId) {
  var container = document.getElementById('radar-container');
  if (!container) return;

  var dims = RADAR_DIMS;
  var n = dims.length;
  var cx = 150, cy = 140, R = 110;
  var angleOffset = -Math.PI / 2; // 從正上方開始

  function polar(i, r) {
    var a = angleOffset + (2 * Math.PI * i) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function polygon(scores, maxScore) {
    return dims.map(function(d, i) {
      var val = (scores[d.key] || 0) / maxScore * R;
      var pt = polar(i, val);
      return pt.x + ',' + pt.y;
    }).join(' ');
  }

  // 背景網格（3 層）
  var gridLines = '';
  [0.33, 0.66, 1].forEach(function(ratio) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var pt = polar(i, R * ratio);
      pts.push(pt.x + ',' + pt.y);
    }
    gridLines += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>';
  });

  // 軸線 + 標籤
  var axes = '';
  dims.forEach(function(d, i) {
    var pt = polar(i, R);
    var labelPt = polar(i, R + 22);
    axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + pt.x + '" y2="' + pt.y + '" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>';
    axes += '<text x="' + labelPt.x + '" y="' + labelPt.y + '" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#3a5878" font-weight="600">' + d.label + '</text>';
  });

  // 兩個多邊形
  var currentPoly = polygon(p.radar, 10);
  var brokerPoly = polygon(p.brokerRadar, 10);

  // 分數標記點
  var currentDots = '', brokerDots = '';
  dims.forEach(function(d, i) {
    var cVal = (p.radar[d.key] || 0) / 10 * R;
    var bVal = (p.brokerRadar[d.key] || 0) / 10 * R;
    var cPt = polar(i, cVal);
    var bPt = polar(i, bVal);
    currentDots += '<circle cx="' + cPt.x + '" cy="' + cPt.y + '" r="3.5" fill="#e74c3c" stroke="#fff" stroke-width="1.5"/>';
    brokerDots += '<circle cx="' + bPt.x + '" cy="' + bPt.y + '" r="3.5" fill="#27ae60" stroke="#fff" stroke-width="1.5"/>';
  });

  var personaLabel = (PERSONA_PAIN_POINTS[personaId] && PERSONA_PAIN_POINTS[personaId].label) || personaId;
  var radarTitle = personaId === 'newbie' ? '壽險通路 vs 保經通路' : '現職 vs 保經';
  var svg = '<svg viewBox="0 0 300 300" role="img" aria-label="' + radarTitle + '：五大關鍵差異雷達圖" style="width:100%;max-width:360px;margin:0 auto;display:block">'
    + '<title>' + radarTitle + '：五大關鍵差異雷達圖</title>'
    + '<desc>比較' + currentLabel + '與' + brokerLabel + '在收入天花板、客戶主權、工作自主、成長空間、退休保障五個維度的評分</desc>'
    + gridLines + axes
    + '<polygon points="' + currentPoly + '" fill="rgba(231,76,60,0.12)" stroke="#e74c3c" stroke-width="1.5" stroke-linejoin="round"/>'
    + '<polygon points="' + brokerPoly + '" fill="rgba(39,174,96,0.12)" stroke="#27ae60" stroke-width="1.5" stroke-linejoin="round"/>'
    + currentDots + brokerDots
    + '</svg>';

  // 圖例（v4.8: 新人無現職，改為「壽險通路 vs 保經通路」）
  var currentLabel = personaId === 'newbie' ? '壽險通路' : '現職';
  var brokerLabel = personaId === 'newbie' ? '保經通路' : '保經';
  var legend = '';
  if (personaId === 'newbie') {
    legend += '<div style="text-align:center;padding:8px 12px;background:#eff6ff;border-radius:8px;margin-bottom:8px;font-size:12px;color:#1d4ed8;">💡 決定入行後，選對通路比努力更重要 — 以下比較壽險公司 vs 保經公司的制度差異</div>';
  }
  legend += '<div style="display:flex;justify-content:center;gap:20px;margin-top:8px;font-size:13px">'
    + '<span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:#e74c3c;display:inline-block"></span><span style="color:#e74c3c;font-weight:600">' + currentLabel + '</span></span>'
    + '<span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:#27ae60;display:inline-block"></span><span style="color:#27ae60;font-weight:600">' + brokerLabel + '</span></span>'
    + '</div>';

  // 痛點清單
  var painList = '<div style="margin-top:14px">';
  p.topPainPoints.forEach(function(pt, i) {
    painList += '<div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:14px;color:#3a5878;line-height:1.5">'
      + '<span style="color:#e74c3c;font-weight:700;flex-shrink:0">' + (i + 1) + '.</span>'
      + '<span>' + pt + '</span></div>';
  });
  painList += '</div>';

  container.innerHTML = svg + legend + painList;
}

/* ─── A-2: 生活節奏對照 ────────────────────────────────────────────── */
function renderDailySchedule(p) {
  var container = document.getElementById('daily-schedule-container');
  if (!container) return;

  var sched = p.dailySchedule;
  var moodColors = { high: '#27ae60', ok: '#f0ad4e', low: '#e74c3c' };
  var moodEmoji = { high: '😊', ok: '😐', low: '😩' };

  function renderColumn(items, label, accentColor) {
    var html = '<div style="flex:1;min-width:0">';
    html += '<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:' + accentColor + ';margin-bottom:8px;text-align:center">' + label + '</div>';
    items.forEach(function(item) {
      var mc = moodColors[item.mood] || '#999';
      var me = moodEmoji[item.mood] || '';
      html += '<div style="display:flex;gap:6px;padding:6px 4px;border-bottom:1px solid rgba(0,0,0,0.04);font-size:13px;line-height:1.4">'
        + '<span style="flex-shrink:0;font-family:\'DM Mono\',monospace;font-size:12px;color:#6a8ea8;min-width:38px">' + item.time + '</span>'
        + '<span style="flex:1;color:#3a5878">' + item.event + '</span>'
        + '<span style="flex-shrink:0" title="' + item.mood + '">' + me + '</span>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  var html = '<div role="region" aria-label="一日生活節奏對照" style="display:flex;gap:12px">'
    + renderColumn(sched.current, '現職的一天', '#e74c3c')
    + '<div style="width:1px;background:rgba(0,0,0,0.08);flex-shrink:0" aria-hidden="true"></div>'
    + renderColumn(sched.broker, '保經的一天', '#27ae60')
    + '</div>';

  container.innerHTML = html;
}

/* ─── A-3: 收入天花板視覺化 ────────────────────────────────────────── */
function renderPainIncome(p, personaId) {
  var container = document.getElementById('pain-income-container');
  if (!container) return;

  var inc = p.typicalIncome;
  var currentAnnual = inc.fyp * (inc.commRate / 100) + (inc.renewalIncome || 0) + (inc.baseSalary || 0);
  // 從 COMPANY_DB 讀取公勝佣金率，避免魔術數字
  var brokerCommPct = 50;
  if (typeof COMPANY_DB !== 'undefined' && COMPANY_DB['gongsheng']) {
    var bd = COMPANY_DB['gongsheng'].brokerDefaults;
    if (bd && bd.brokerComm != null) brokerCommPct = bd.brokerComm;
  }
  var brokerAnnual = inc.fyp * (brokerCommPct / 100) + (inc.renewalIncome || 0) * 1.2;
  if (inc.baseSalary) {
    // 銀行理專：保經第一年靠佣金補底薪（無底薪加成）
    brokerAnnual = inc.fyp * (brokerCommPct / 100) + (inc.renewalIncome || 0);
  }

  var maxVal = Math.max(currentAnnual, brokerAnnual);
  var currentPct = Math.round((currentAnnual / maxVal) * 100);
  var brokerPct = 100;

  var fmtW = function(v) { return (v / 10000).toFixed(0) + ' 萬'; };
  var diffPct = Math.round(((brokerAnnual - currentAnnual) / currentAnnual) * 100);

  var html = '<div class="card">';
  html += '<div style="font-size:13px;color:#6a8ea8;margin-bottom:12px">以' + p.label + '典型產能估算（僅供趨勢參考）</div>';

  // 現職 bar
  html += '<div style="margin-bottom:12px">';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:#e74c3c;font-weight:600">現職年收入</span><span style="font-family:\'DM Mono\',monospace;color:#e74c3c">' + fmtW(currentAnnual) + '</span></div>';
  html += '<div class="bar-track"><div class="bar-fill trad" style="width:' + currentPct + '%"></div></div>';
  html += '</div>';

  // 保經 bar
  html += '<div style="margin-bottom:12px">';
  html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="color:#27ae60;font-weight:600">保經年收入</span><span style="font-family:\'DM Mono\',monospace;color:#27ae60">' + fmtW(brokerAnnual) + '</span></div>';
  html += '<div class="bar-track"><div class="bar-fill broker" style="width:' + brokerPct + '%"></div></div>';
  html += '</div>';

  // 差距標記
  if (diffPct > 0) {
    html += '<div style="text-align:center;padding:8px;background:rgba(39,174,96,0.08);border-radius:8px;font-size:14px;color:#27ae60;font-weight:600">';
    html += '保經收入約為現職的 ' + (diffPct + 100) + '%（高出 ' + fmtW(brokerAnnual - currentAnnual) + '）';
    html += '</div>';
  }

  html += '<div style="margin-top:8px;font-size:12px;color:#6a8ea8">⚠️ 實際收入因個人業績、商品組合、市場環境而異。以上數字僅供趨勢參考。</div>';
  html += '</div>';

  container.innerHTML = html;
}

/* ─── A-4: 觀念溝通卡片 ─────────────────────────────────────────── */
function renderPainScripts(p) {
  var container = document.getElementById('pain-scripts-container');
  if (!container) return;

  var objs = p.topObjections;
  if (!objs || !objs.length) { container.innerHTML = ''; return; }

  var html = '<div class="pain-cards-wrap">';
  objs.forEach(function(obj, i) {
    html += '<div class="pain-script-card" tabindex="0" role="button" aria-expanded="false" onclick="this.classList.toggle(\'open\');this.setAttribute(\'aria-expanded\',this.classList.contains(\'open\'))" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}">';
    html += '<div class="pain-card-q">❓ ' + obj.q + '</div>';
    html += '<div class="pain-card-a"><div class="pain-card-a-label">💡 參考回應</div>' + obj.a;
    if (obj.followUp) {
      html += '<div class="pain-followup" style="margin-top:12px;padding:10px 12px;background:rgba(154,110,0,0.06);border-left:3px solid var(--gold,#9a6e00);border-radius:0 8px 8px 0">';
      html += '<div style="font-size:13px;color:var(--gold,#9a6e00);font-weight:600;margin-bottom:4px">🔄 延伸思考</div>';
      html += '<div style="font-size:14px;color:var(--text-dim,#3a5878);font-weight:600;margin-bottom:6px">「' + obj.followUp.q + '」</div>';
      html += '<div style="font-size:14px;color:var(--text,#1a2d42);line-height:1.6">' + obj.followUp.a + '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="script-disclaimer">⚠️ 以上內容僅供面談參考，請依對方實際狀況調整。不構成任何形式之收入承諾或轉職建議。</div>';

  container.innerHTML = html;
}
