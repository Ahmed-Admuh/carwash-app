// auth.js — shared across all pages.
// This is a real app the user runs on their own machine/server, not a
// sandboxed Claude.ai artifact, so localStorage is fine here for the
// session token.

// ============================================================
// EDIT THIS after you deploy the backend to Render — replace the
// placeholder with your actual Render URL (Render shows it on your
// service's dashboard page, looks like https://something.onrender.com).
// ============================================================
const DEPLOYED_API_BASE = "https://carwash-app-jurb.onrender.com/api";

// Auto-detects the right API host:
// - Viewing the page on localhost or a LAN IP (e.g. testing on your phone
//   over WiFi) → talks to a locally-running backend on port 5000.
// - Viewing the page anywhere else (e.g. your deployed Cloudflare Pages
//   site) → talks to the deployed backend above.
const IS_LOCAL_HOST = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(window.location.hostname);
const API_BASE = IS_LOCAL_HOST
  ? `${window.location.protocol}//${window.location.hostname}:5000/api`
  : DEPLOYED_API_BASE;
const AUTH_TOKEN_KEY = "cwf_token";
const AUTH_USER_KEY = "cwf_user";

const Auth = {
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    } catch {
      return null;
    }
  },
  isLoggedIn() {
    return !!Auth.getToken();
  },
  setSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    if (window.DemoMode) DemoMode.disable();
    window.location.href = "login.html";
  },
  requireAuth() {
    if (!Auth.isLoggedIn()) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `login.html?returnTo=${returnTo}`;
      return false;
    }
    return true;
  },
  // Use on pages that should only be visited by a given role (e.g. the
  // seller dashboard). Redirects customers to the regular home page.
  requireRole(role) {
    if (!Auth.requireAuth()) return false;
    const user = Auth.getUser();
    if (!user || user.role !== role) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  },
  initials(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join("");
  },
  // Demo mode: a client-side-only mock of the backend (see demo-mode.js).
  // No server or database required — everything lives in this browser's
  // localStorage. Bookings, points, etc. persist across reloads here, but
  // there's no real server behind any of it.
  isDemoMode() {
    return window.DemoMode ? DemoMode.isActive() : false;
  },
  startDemo(role) {
    DemoMode.enable();
    const email = role === "seller" ? "demo.admin@carwash.app" : "demo.customer@carwash.app";
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: "demo1234", expectRole: role })
    }).then(data => {
      Auth.setSession(data.token, data.user);
      return data.user;
    });
  },
  exitDemo() {
    Auth.logout();
  }
};

// Small banner shown across the top of every page while in demo mode, so
// it's always obvious no real server/database is involved.
function renderDemoBanner() {
  if (!Auth.isDemoMode()) return;
  if (document.getElementById("demoBanner")) return;
  const t = (key, fallback) => (window.I18n ? I18n.t(key) : fallback);
  const banner = document.createElement("div");
  banner.id = "demoBanner";
  banner.className = "demo-banner";
  banner.innerHTML = `
    <span><i class="fas fa-flask"></i> ${t('demo_banner_text', 'Demo mode — no server or database, changes only saved in this browser')}</span>
    <button id="exitDemoBtn">${t('demo_exit', 'Exit demo')}</button>
  `;
  document.body.prepend(banner);
  document.getElementById("exitDemoBtn").addEventListener("click", () => Auth.exitDemo());
}

// Fetch wrapper that attaches the auth token and gives friendly errors.
// In demo mode, this routes to DemoAPI (see demo-mode.js) instead of a
// real server — same function signature, same error shape, so the rest of
// the app doesn't need to know which mode it's in.
async function apiFetch(path, options = {}) {
  if (Auth.isDemoMode() && window.DemoAPI) {
    try {
      const method = (options.method || "GET").toUpperCase();
      const result = await DemoAPI.request(method, path, options.body);
      return result.data;
    } catch (err) {
      if (err.status === 401) Auth.logout();
      throw err;
    }
  }

  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = Auth.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error("Can't reach the server. Is the backend running on localhost:5000? (Tip: try Demo Mode on the login page — no server needed.)");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    if (response.status === 401) {
      Auth.logout();
    }
    throw new Error((data && data.error) || `Request failed (${response.status})`);
  }

  return data;
}

// Small toast helper — expects a <div class="toast" id="toast"> on the page.
function showToast(message, isError = false) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// Renders the appbar's right-side auth control (avatar if logged in, "Sign in" if not).
// Expects an element with id="authSlot" in the appbar.
function renderAuthSlot() {
  const slot = document.getElementById("authSlot");
  if (!slot) return;

  const user = Auth.getUser();
  if (user) {
    const target = user.role === 'seller' ? 'seller-dashboard.html' : 'profile.html';
    slot.innerHTML = `<a href="${target}" class="avatar-btn" title="${user.name}">${Auth.initials(user.name)}</a>`;
  } else {
    slot.innerHTML = `<a href="login.html" class="appbar-btn" title="Sign in"><i class="fas fa-user"></i></a>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAuthSlot();
  renderDemoBanner();
});
