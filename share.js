/**
 * share.js — 截圖分享 + URL 參數路由
 * Dependencies: html2canvas (CDN)
 * MDRT-BPS v4.1
 */

/* ═══════════════════════════════════════════════════════════════════════════
   1. URL 參數路由 — ?persona=banker&tab=A&company=nanshan-life
   ═══════════════════════════════════════════════════════════════════════════ */
(function initUrlParams() {
  var params = new URLSearchParams(window.location.search);
  var persona = params.get('persona');
  var tab = params.get('tab');
  var company = params.get('company');
  var broker = params.get('broker');

  // 合法身份列表
  var validPersonas = ['insurance', 'banker', 'manager', 'medical', 'newbie', 'realtor', 'auto'];

  if (persona && validPersonas.indexOf(persona) !== -1) {
    // 設定 Tab A 身份
    if (typeof window.painPersonaId !== 'undefined') window.painPersonaId = persona;

    // 設定 Tab B 身份
    if (typeof window.CID !== 'undefined') {
      window.CID = persona;
      window.currentPersonaId = persona;
    }

    // 觸發身份 UI 更新（等 DOM ready）
    setTimeout(function() {
      // Tab A 身份按鈕
      var painBtn = document.querySelector('#pain-identity-tabs .id-btn[onclick*="' + persona + '"]');
      if (painBtn) {
        document.querySelectorAll('#pain-identity-tabs .id-btn').forEach(function(b) { b.className = 'id-btn'; });
        painBtn.classList.add('active', 'active-' + persona);
      }
      // Tab B 身份按鈕
      var idBtn = document.querySelector('.id-bar .id-btn[onclick*="' + persona + '"]');
      if (idBtn) {
        document.querySelectorAll('.id-bar .id-btn').forEach(function(b) { b.className = 'id-btn'; });
        idBtn.classList.add('active', 'active-' + persona);
      }
      // 渲染
      if (typeof renderInputs === 'function') renderInputs(persona);
      if (typeof renderTabA === 'function') renderTabA(persona);
    }, 100);
  }

  // 公司選擇
  if (company && typeof window.COMPANY_DB !== 'undefined' && window.COMPANY_DB[company]) {
    window.selectedCompanyId = company;
    setTimeout(function() {
      if (typeof applyCompanyDefaults === 'function') applyCompanyDefaults(company, window.CID);
      if (typeof recalc === 'function') recalc();
    }, 150);
  }

  if (broker && typeof window.COMPANY_DB !== 'undefined' && window.COMPANY_DB[broker]) {
    window.selectedBrokerId = broker;
    setTimeout(function() {
      if (typeof applyBrokerDefaults === 'function') applyBrokerDefaults(broker, window.CID);
      if (typeof recalc === 'function') recalc();
    }, 150);
  }

  // Tab 切換
  if (tab === 'B' || tab === 'b') {
    setTimeout(function() {
      var btn = document.querySelector('.main-tab[data-tab="B"]');
      if (typeof switchTab === 'function') switchTab('B', btn);
    }, 200);
  }
  // Tab A 是預設，不需要額外動作
})();


/* ═══════════════════════════════════════════════════════════════════════════
   2. 產生分享連結
   ═══════════════════════════════════════════════════════════════════════════ */
function getShareUrl() {
  var base = window.location.origin + window.location.pathname;
  var params = [];

  // 身份
  var pid = (typeof currentTab !== 'undefined' && currentTab === 'A')
    ? (window.painPersonaId || 'insurance')
    : (window.CID || 'insurance');
  params.push('persona=' + pid);

  // Tab
  params.push('tab=' + (window.currentTab || 'A'));

  // 公司（僅 Tab B）
  if (window.currentTab === 'B') {
    if (window.selectedCompanyId) params.push('company=' + window.selectedCompanyId);
    if (window.selectedBrokerId) params.push('broker=' + window.selectedBrokerId);
  }

  return base + '?' + params.join('&');
}


/* ═══════════════════════════════════════════════════════════════════════════
   3. 截圖分享（html2canvas）
   ═══════════════════════════════════════════════════════════════════════════ */
function captureAndShare(targetSelector, filename) {
  var el = document.querySelector(targetSelector);
  if (!el) { alert('找不到要截圖的區塊'); return; }

  // 確保 html2canvas 已載入
  if (typeof html2canvas === 'undefined') {
    alert('截圖功能載入中，請稍後再試');
    return;
  }

  // 顯示載入狀態
  var btn = event && event.currentTarget;
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '截圖中...'; btn.disabled = true; }

  html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  }).then(function(canvas) {
    // 嘗試用 Web Share API（手機原生分享）
    if (navigator.share && navigator.canShare) {
      canvas.toBlob(function(blob) {
        var file = new File([blob], (filename || 'mdrt-推演結果') + '.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            title: 'MDRT 推演結果',
            text: '五年收入推演結果 — ' + getShareUrl(),
            files: [file]
          }).catch(function() {
            // 使用者取消分享，改用下載
            downloadCanvas(canvas, filename);
          });
        } else {
          downloadCanvas(canvas, filename);
        }
      }, 'image/png');
    } else {
      downloadCanvas(canvas, filename);
    }
  }).catch(function(err) {
    console.error('截圖失敗:', err);
    alert('截圖失敗，請重試');
  }).finally(function() {
    if (btn) { btn.textContent = origText; btn.disabled = false; }
  });
}

function downloadCanvas(canvas, filename) {
  var link = document.createElement('a');
  link.download = (filename || 'mdrt-推演結果') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// 複製分享連結
function copyShareLink() {
  var url = getShareUrl();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function() {
      showShareToast('已複製分享連結');
    });
  } else {
    // fallback
    var ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showShareToast('已複製分享連結');
  }
}

function showShareToast(msg) {
  var toast = document.getElementById('share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a2d42;color:#fff;padding:10px 24px;border-radius:24px;font-size:14px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(function() { toast.style.opacity = '0'; }, 2000);
}
