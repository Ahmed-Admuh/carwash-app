// menu.js — shared slide-out navigation drawer.
// Wires up any button with [data-menu-toggle] (or the classic hamburger
// button with aria-label="Menu") to open a drawer with links to every
// major section of the app, adjusted for whether the visitor is logged in
// and what role they have.

function buildMenuDrawer() {
  if (document.getElementById('navDrawer')) return; // already built

  const user = (window.Auth && Auth.getUser) ? Auth.getUser() : null;
  const t = (key, fallback) => (window.I18n ? I18n.t(key) : fallback);

  const links = [
    { href: 'index.html', icon: 'fa-home', key: 'nav_home', label: 'Home' },
    { href: 'book.html', icon: 'fa-search', key: 'nav_search', label: 'Search' },
    { href: 'about.html', icon: 'fa-circle-info', key: 'nav_about', label: 'About' }
  ];

  if (user) {
    if (user.role === 'seller') {
      links.push({ href: 'seller-dashboard.html', icon: 'fa-store', key: 'seller_dashboard_title', label: 'Seller Dashboard' });
    } else {
      links.push({ href: 'profile.html', icon: 'fa-user', key: 'nav_profile', label: 'Profile' });
      links.push({ href: 'profile.html#history', icon: 'fa-history', key: 'btn_order_history', label: 'Order History' });
    }
  } else {
    links.push({ href: 'login.html', icon: 'fa-arrow-right-to-bracket', key: 'btn_log_in', label: 'Log In' });
    links.push({ href: 'signup.html', icon: 'fa-user-plus', key: 'btn_create_account', label: 'Create Account' });
  }

  const overlay = document.createElement('div');
  overlay.id = 'navDrawerOverlay';
  overlay.className = 'nav-drawer-overlay';

  const drawer = document.createElement('div');
  drawer.id = 'navDrawer';
  drawer.className = 'nav-drawer';

  const linksHtml = links.map(l => `
    <a href="${l.href}" class="nav-drawer-link">
      <i class="fas ${l.icon}"></i>
      <span data-i18n="${l.key}">${t(l.key, l.label)}</span>
    </a>
  `).join('');

  const logoutHtml = user ? `
    <button class="nav-drawer-link nav-drawer-logout" id="drawerLogoutBtn">
      <i class="fas fa-sign-out-alt"></i>
      <span data-i18n="btn_log_out">${t('btn_log_out', 'Log Out')}</span>
    </button>
  ` : '';

  drawer.innerHTML = `
    <div class="nav-drawer-header">
      <div class="nav-drawer-brand"><i class="fas fa-car-side"></i> Car Wash Finder</div>
      <button class="modal-close" id="drawerCloseBtn">&times;</button>
    </div>
    ${user ? `<div class="nav-drawer-user"><div class="nav-drawer-avatar">${(window.Auth && Auth.initials) ? Auth.initials(user.name) : '?'}</div><div><div class="nav-drawer-user-name">${user.name}</div><div class="nav-drawer-user-role">${user.role === 'seller' ? 'Wash Owner' : 'Customer'}</div></div></div>` : ''}
    <nav class="nav-drawer-links">${linksHtml}</nav>
    ${logoutHtml}
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  function openDrawer() {
    overlay.classList.add('active');
    drawer.classList.add('active');
  }
  function closeDrawer() {
    overlay.classList.remove('active');
    drawer.classList.remove('active');
  }

  overlay.addEventListener('click', closeDrawer);
  document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
  const logoutBtn = document.getElementById('drawerLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { if (window.Auth) Auth.logout(); });

  // Wire up every menu-toggle button on the page (usually just one).
  document.querySelectorAll('[data-menu-toggle], .appbar-btn[aria-label="Menu"]').forEach(btn => {
    btn.addEventListener('click', openDrawer);
  });

  if (window.I18n) I18n.applyTranslations();
}

document.addEventListener('DOMContentLoaded', buildMenuDrawer);
