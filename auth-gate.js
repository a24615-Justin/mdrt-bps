/**
 * MDRT-BPS Auth Gate v2
 * 白名單驗證 — 不需要 Supabase SDK，不需要 email 驗證
 *
 * 流程：
 * 1. 頁面載入 → 檢查 sessionStorage 是否有有效 token
 * 2. 無 token → 顯示 email 輸入畫面
 * 3. 輸入 email → 呼叫 verify-bps-access EF
 * 4. EF 回傳 granted: true → 存 token、解鎖主內容
 * 5. EF 回傳 granted: false → 顯示對應錯誤訊息
 */

const BPS_AUTH = {
  verifyUrl: 'https://erslinimiwswobichelt.supabase.co/functions/v1/verify-bps-access',
  tokenKey: 'bps_access_token',
};

/* ── UI ── */

function createAuthGateUI() {
  const overlay = document.createElement('div');
  overlay.id = 'auth-gate-overlay';
  overlay.innerHTML = `
    <div id="auth-gate-card">
      <div class="auth-logo">🔐</div>
      <h2>MDRT-BPS 增員推演工具</h2>
      <p class="auth-subtitle">此工具僅限授權使用者存取</p>

      <div id="auth-login-form">
        <label for="auth-email">請輸入您的 Email</label>
        <input type="email" id="auth-email" placeholder="your@email.com" autocomplete="email" />
        <button id="auth-submit-btn" onclick="handleVerify()">登入</button>
        <p id="auth-error" class="auth-error" style="display:none"></p>
      </div>

      <div id="auth-denied" style="display:none">
        <div class="auth-denied-icon">🚫</div>
        <p id="auth-denied-msg">您尚未被授權使用此工具</p>
        <p class="auth-hint">請聯繫您的主管或培訓負責人開通存取權限。</p>
        <button class="auth-link-btn" onclick="showLoginForm()">重新輸入 Email</button>
      </div>

      <div id="auth-loading" style="display:none">
        <div class="auth-spinner"></div>
        <p>驗證中...</p>
      </div>
    </div>
  `;
  document.body.prepend(overlay);
  hideApp();
}

function injectAuthStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #auth-gate-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: linear-gradient(135deg, #1a2d42 0%, #0f1923 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', 'Noto Serif TC', sans-serif;
    }
    #auth-gate-overlay.fade-out {
      animation: authFadeOut 0.4s ease forwards;
    }
    @keyframes authFadeOut {
      to { opacity: 0; pointer-events: none; }
    }
    #auth-gate-card {
      background: #fff; border-radius: 16px; padding: 48px 40px;
      max-width: 420px; width: 90%; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .auth-logo { font-size: 48px; margin-bottom: 16px; }
    #auth-gate-card h2 {
      font-family: 'Noto Serif TC', serif;
      font-size: 22px; font-weight: 700; color: #1a2d42; margin: 0 0 8px;
    }
    .auth-subtitle { color: #6b7280; font-size: 14px; margin: 0 0 28px; }
    #auth-gate-card label {
      display: block; text-align: left; font-size: 13px;
      font-weight: 500; color: #374151; margin-bottom: 6px;
    }
    #auth-email {
      width: 100%; box-sizing: border-box; padding: 12px 16px;
      border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;
      outline: none; transition: border-color 0.2s;
    }
    #auth-email:focus { border-color: #C8963E; }
    #auth-submit-btn {
      width: 100%; margin-top: 16px; padding: 14px;
      background: linear-gradient(135deg, #C8963E, #b0832f);
      color: #fff; font-size: 16px; font-weight: 600;
      border: none; border-radius: 10px; cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    #auth-submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(200,150,62,0.4);
    }
    #auth-submit-btn:disabled {
      opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none;
    }
    .auth-error { color: #dc2626; font-size: 13px; margin-top: 12px; }
    .auth-denied-icon { font-size: 48px; margin-bottom: 12px; }
    .auth-hint { color: #6b7280; font-size: 13px; line-height: 1.6; }
    .auth-link-btn {
      background: none; border: none; color: #C8963E;
      font-size: 14px; cursor: pointer; margin-top: 16px;
      text-decoration: underline;
    }
    .auth-spinner {
      width: 36px; height: 36px; margin: 0 auto 16px;
      border: 3px solid #e5e7eb; border-top-color: #C8963E;
      border-radius: 50%; animation: authSpin 0.8s linear infinite;
    }
    @keyframes authSpin { to { transform: rotate(360deg); } }
    #auth-gate-card p { margin: 8px 0; }
  `;
  document.head.appendChild(style);
}

/* ── 狀態切換 ── */

function hideApp() {
  document.querySelector('header')?.style.setProperty('display', 'none');
  document.querySelector('main')?.style.setProperty('display', 'none');
  document.querySelector('footer')?.style.setProperty('display', 'none');
}

function showLoginForm() {
  document.getElementById('auth-login-form').style.display = '';
  document.getElementById('auth-denied').style.display = 'none';
  document.getElementById('auth-loading').style.display = 'none';
  document.getElementById('auth-error').style.display = 'none';
}

function showDenied(msg) {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-loading').style.display = 'none';
  document.getElementById('auth-denied').style.display = '';
  document.getElementById('auth-denied-msg').textContent = msg;
}

function showLoading() {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-denied').style.display = 'none';
  document.getElementById('auth-loading').style.display = '';
}

function unlockApp() {
  const overlay = document.getElementById('auth-gate-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 400);
  }
  document.querySelector('header')?.style.removeProperty('display');
  document.querySelector('main')?.style.removeProperty('display');
  document.querySelector('footer')?.style.removeProperty('display');
}

/* ── 核心邏輯 ── */

const DENY_MESSAGES = {
  not_found: '此 Email 尚未被授權使用此工具',
  inactive: '您的存取權限已被停用',
  expired: '您的存取權限已到期',
  limit_reached: '已達使用次數上限',
};

async function handleVerify() {
  const emailInput = document.getElementById('auth-email');
  const submitBtn = document.getElementById('auth-submit-btn');
  const errorEl = document.getElementById('auth-error');

  const email = emailInput.value.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    errorEl.textContent = '請輸入有效的 Email 地址';
    errorEl.style.display = '';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '驗證中...';
  errorEl.style.display = 'none';

  try {
    const resp = await fetch(BPS_AUTH.verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await resp.json();

    if (resp.ok && data.granted) {
      // 儲存 token 到 sessionStorage
      sessionStorage.setItem(BPS_AUTH.tokenKey, data.token);
      unlockApp();
    } else if (resp.status === 429) {
      errorEl.textContent = '請求過於頻繁，請稍後再試';
      errorEl.style.display = '';
    } else {
      showDenied(DENY_MESSAGES[data.reason] || '驗證失敗，請稍後再試');
    }
  } catch (err) {
    errorEl.textContent = '網路錯誤，請檢查連線後重試';
    errorEl.style.display = '';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '登入';
  }
}

function checkStoredToken() {
  const tokenStr = sessionStorage.getItem(BPS_AUTH.tokenKey);
  if (!tokenStr) return false;

  try {
    const token = JSON.parse(atob(tokenStr));
    // 檢查是否在 24 小時內
    if (token.exp && Date.now() < token.exp) {
      return true;
    }
  } catch {
    // token 無效
  }

  sessionStorage.removeItem(BPS_AUTH.tokenKey);
  return false;
}

// Enter 鍵提交
function setupEnterKey() {
  const emailInput = document.getElementById('auth-email');
  if (emailInput) {
    emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleVerify();
    });
  }
}

/* ── 啟動 ── */

function initAuthGate() {
  // 已有有效 token → 直接進入
  if (checkStoredToken()) return;

  injectAuthStyles();
  createAuthGateUI();
  setupEnterKey();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthGate);
} else {
  initAuthGate();
}
