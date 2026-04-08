/**
 * MDRT-BPS Auth Gate
 * 整合 Supabase Auth — Magic Link 無密碼登入 + 白名單存取控制
 *
 * 流程：
 * 1. 頁面載入 → 檢查是否有有效 session
 * 2. 無 session → 顯示登入畫面（輸入 email → 寄 Magic Link）
 * 3. 有 session → 查 mdrt_bps_access 表確認白名單
 * 4. 白名單通過 → 隱藏閘門、顯示主內容
 * 5. 未在白名單 → 顯示「無權限」提示
 */

const AUTH_CONFIG = {
  supabaseUrl: 'https://erslinimiwswobichelt.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyc2xpbmltaXdzd29iaWNoZWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODY1MTYsImV4cCI6MjA4Njc2MjUxNn0.3hl9QQ3xnIz_1xshJKJaj6LEhTV2VEBMyUQ_o6KP4UE',
  redirectUrl: window.location.origin + window.location.pathname,
};

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = window.supabase.createClient(AUTH_CONFIG.supabaseUrl, AUTH_CONFIG.supabaseAnonKey);
  }
  return _supabase;
}

/* ── UI 建構 ── */

function createAuthGateUI() {
  // 遮罩層
  const overlay = document.createElement('div');
  overlay.id = 'auth-gate-overlay';
  overlay.innerHTML = `
    <div id="auth-gate-card">
      <div class="auth-logo">🔐</div>
      <h2>MDRT-BPS 增員推演工具</h2>
      <p class="auth-subtitle">此工具僅限授權使用者存取</p>

      <!-- 登入表單 -->
      <div id="auth-login-form">
        <label for="auth-email">請輸入您的 Email</label>
        <input type="email" id="auth-email" placeholder="your@email.com" autocomplete="email" />
        <button id="auth-submit-btn" onclick="handleMagicLink()">
          發送登入連結
        </button>
        <p id="auth-error" class="auth-error" style="display:none"></p>
      </div>

      <!-- 已寄出提示 -->
      <div id="auth-sent" style="display:none">
        <div class="auth-sent-icon">✉️</div>
        <p>登入連結已寄出！</p>
        <p class="auth-hint">請到信箱點擊連結完成登入。<br>沒收到？請檢查垃圾信件匣。</p>
        <button class="auth-link-btn" onclick="showLoginForm()">重新輸入 Email</button>
      </div>

      <!-- 無權限提示 -->
      <div id="auth-denied" style="display:none">
        <div class="auth-denied-icon">🚫</div>
        <p>您的帳號尚未被授權使用此工具</p>
        <p class="auth-hint">請聯繫您的主管或培訓負責人開通存取權限。</p>
        <p id="auth-denied-email" class="auth-denied-email"></p>
        <button class="auth-link-btn" onclick="handleLogout()">換一個帳號登入</button>
      </div>

      <!-- 載入中 -->
      <div id="auth-loading" style="display:none">
        <div class="auth-spinner"></div>
        <p>驗證中...</p>
      </div>
    </div>
  `;
  document.body.prepend(overlay);

  // 隱藏主內容
  document.querySelector('header')?.style.setProperty('display', 'none');
  document.querySelector('main')?.style.setProperty('display', 'none');
  document.querySelector('footer')?.style.setProperty('display', 'none');
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
    .auth-sent-icon, .auth-denied-icon { font-size: 48px; margin-bottom: 12px; }
    .auth-hint { color: #6b7280; font-size: 13px; line-height: 1.6; }
    .auth-denied-email { color: #9ca3af; font-size: 12px; margin-top: 8px; }
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

function showLoginForm() {
  document.getElementById('auth-login-form').style.display = '';
  document.getElementById('auth-sent').style.display = 'none';
  document.getElementById('auth-denied').style.display = 'none';
  document.getElementById('auth-loading').style.display = 'none';
  document.getElementById('auth-error').style.display = 'none';
}

function showSent() {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-sent').style.display = '';
}

function showDenied(email) {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-loading').style.display = 'none';
  document.getElementById('auth-denied').style.display = '';
  document.getElementById('auth-denied-email').textContent = email || '';
}

function showLoading() {
  document.getElementById('auth-login-form').style.display = 'none';
  document.getElementById('auth-sent').style.display = 'none';
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

async function handleMagicLink() {
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
  submitBtn.textContent = '傳送中...';
  errorEl.style.display = 'none';

  try {
    const sb = getSupabase();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: AUTH_CONFIG.redirectUrl,
      },
    });

    if (error) throw error;
    showSent();
  } catch (err) {
    errorEl.textContent = '傳送失敗：' + (err.message || '請稍後再試');
    errorEl.style.display = '';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '發送登入連結';
  }
}

async function checkAccess(email) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('mdrt_bps_access')
    .select('id, is_active, expires_at, max_sessions, session_count')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[auth-gate] access check error:', error);
    return false;
  }
  if (!data) return false;

  // 檢查過期
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return false;
  }

  // 檢查使用次數上限
  if (data.max_sessions > 0 && data.session_count >= data.max_sessions) {
    return false;
  }

  // 更新 session_count 和 last_accessed_at
  await sb
    .from('mdrt_bps_access')
    .update({
      session_count: (data.session_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  return true;
}

async function handleLogout() {
  const sb = getSupabase();
  await sb.auth.signOut();
  showLoginForm();
}

async function initAuthGate() {
  injectAuthStyles();
  createAuthGateUI();

  const sb = getSupabase();

  // 監聽 auth 狀態變化（處理 Magic Link 回調）
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      showLoading();
      const email = session.user.email;
      const hasAccess = await checkAccess(email);

      if (hasAccess) {
        unlockApp();
      } else {
        showDenied(email);
      }
    }
  });

  // 初始檢查：是否已有 session
  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    showLoading();
    const email = session.user.email;
    const hasAccess = await checkAccess(email);

    if (hasAccess) {
      unlockApp();
    } else {
      showDenied(email);
    }
  }
  // 無 session → 保持在登入表單畫面
}

/* ── 啟動 ── */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthGate);
} else {
  initAuthGate();
}
