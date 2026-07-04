/* ================================================================
   HRMS API Client — JWT auth, real backend, zero hardcoded data
   ================================================================ */

const BASE = (typeof window !== 'undefined' && window.HRMS_API_URL) ? window.HRMS_API_URL : 'http://localhost:3000/api';

// ── Auth ──────────────────────────────────────────────────────
export const Auth = {
  token:  () => sessionStorage.getItem('hrms_token'),
  user:   () => JSON.parse(sessionStorage.getItem('hrms_user') || 'null'),
  set(token, user) {
    sessionStorage.setItem('hrms_token', token);
    sessionStorage.setItem('hrms_user', JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem('hrms_token');
    sessionStorage.removeItem('hrms_user');
  },
  requireLogin() { if (!this.token()) window.location.href = 'index.html'; },
  isHR() { const u = this.user(); return u && (u.role === 'hr' || u.role === 'admin'); }
};

// ── Fetch wrapper ─────────────────────────────────────────────
export async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000), // 20s timeout for Railway cold starts
  };
  const token = Auth.token();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(BASE + path, opts);
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Server is waking up, please try again in a few seconds.');
    }
    throw new Error('Network error — check your connection and try again.');
  }

  // 401 on protected routes = expired token, redirect to login
  // but NOT on /auth/login or /auth/register (those return 401 for wrong creds)
  if (res.status === 401 && !path.includes('/auth/')) {
    Auth.clear();
    window.location.href = 'index.html';
    return null;
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('Unexpected server response. Please try again.');
  }

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}
export const get  = p      => api('GET',    p);
export const post = (p, b) => api('POST',   p, b);
export const put  = (p, b) => api('PUT',    p, b);
export const del  = p      => api('DELETE', p);

// ── Utilities ─────────────────────────────────────────────────
export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function avatar(name, color, size = 38) {
  const bg = color || '#5B2D8E';
  const fs = Math.floor(size * 0.36);
  return `<div class="emp-avatar" style="background:${bg};width:${size}px;height:${size}px;font-size:${fs}px">${initials(name)}</div>`;
}

const STATUS_MAP = {
  present:'Present', absent:'Absent', half_day:'Half-Day', on_leave:'On Leave',
  pending:'Pending', approved:'Approved', rejected:'Rejected',
  draft:'Draft', confirmed:'Confirmed', paid:'Paid',
  ANNUAL:'Annual', SICK:'Sick', UNPAID:'Unpaid', CASUAL:'Casual',
  hr:'HR Officer', admin:'Admin', employee:'Employee',
};
export function badge(key, label) {
  const l = label || STATUS_MAP[key] || key;
  const k = (key || '').toLowerCase().replace(/[\s\/]/g, '_');
  return `<span class="badge badge-${k}">${l}</span>`;
}

export function statusDot(status) {
  const map = { present:'Present', absent:'Absent', half_day:'Half-Day', on_leave:'On Leave' };
  return `<span class="status-dot ${status}">${map[status] || status}</span>`;
}

export function formatHours(h) {
  if (!h) return '0h 00m';
  const hrs = Math.floor(h);
  const min = Math.round((h - hrs) * 60);
  return `${hrs}h ${String(min).padStart(2, '0')}m`;
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7)  return `${d} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function toast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = `${icons[type === 'danger' ? 'x' : 'check']} <span>${msg}</span>`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Global API error banner (shown when backend is down) ──────
export function showApiError(msg) {
  let b = document.getElementById('globalApiError');
  if (!b) {
    b = document.createElement('div');
    b.id = 'globalApiError';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9998;background:#7f1d1d;color:#fff;padding:10px 20px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between';
    document.body.appendChild(b);
  }
  b.innerHTML = `<span>⚠ API Error: ${msg}</span><button onclick="location.reload()" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px">Retry</button>`;
}

// ── SVG Icon Library ──────────────────────────────────────────
export const icons = {
  dashboard:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  employees:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  attendance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>`,
  leave:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  payroll:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  logout:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  checkin:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
  search:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  bell:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  grid:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  plus:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  filter:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  download:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  check:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:          `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  user:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  money:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  calendar:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  clock:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  settings:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  support:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  trending:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  building:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
};

// ── Shared layout renderers ───────────────────────────────────
export function renderSidebar(active) {
  const user = Auth.user();
  const isHR = Auth.isHR();
  const nav = [
    { id:'dashboard',  label:'Dashboard',      icon:'dashboard',  hrOnly:true,  href:'dashboard.html' },
    { id:'employees',  label:'Employees',       icon:'employees',  hrOnly:false, href:'employees.html' },
    { id:'attendance', label:'Attendance',      icon:'attendance', hrOnly:false, href:'attendance.html' },
    { id:'leave',      label:'Leave/Time-Off',  icon:'leave',      hrOnly:false, href:'leave.html' },
    { id:'payroll',    label:'Payroll',         icon:'payroll',    hrOnly:false, href:'payroll.html' },
  ];
  const items = nav.filter(n => !n.hrOnly || isHR).map(n =>
    `<a href="${n.href}" class="nav-item ${active === n.id ? 'active' : ''}">
       ${icons[n.icon]}<span>${n.label}</span>
     </a>`
  ).join('');
  return `
    <div class="sidebar-brand">
      <div class="brand-logo-wrap">
        <img src="company logo/Screenshot 2026-07-04 112039.png" alt="Odoo" class="sidebar-logo"/>
      </div>
      <div class="brand-sub">${isHR ? 'Admin Portal' : 'Employee Portal'}</div>
    </div>
    <nav class="sidebar-nav">${items}</nav>
    <div class="sidebar-bottom">
      <div class="sidebar-bottom-links">
        <a href="#" class="nav-item-sub">${icons.settings}<span>Settings</span></a>
        <a href="#" class="nav-item-sub" onclick="doLogout();return false;">${icons.support}<span>Support</span></a>
      </div>
      <button class="sidebar-checkin-btn" onclick="window.location.href='attendance.html'">
        ${icons.checkin} Check In/Out
      </button>
    </div>`;
}

export function renderTopbar() {
  const user = Auth.user() || {};
  return `
    <button class="topbar-hamburger" id="sidebarToggle" style="display:none" onclick="toggleSidebar()" aria-label="Toggle menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <div class="topbar-search">
      ${icons.search}
      <input type="text" placeholder="Search employees or records…" id="globalSearch" autocomplete="off" oninput="if(window.onGlobalSearch)onGlobalSearch(this.value)"/>
    </div>
    <div class="topbar-right">
      <button class="topbar-icon" title="Notifications" onclick="topbarNotif()" aria-label="Notifications">${icons.bell}</button>
      <button class="topbar-icon" title="Apps" onclick="topbarApps()" aria-label="Apps">${icons.grid}</button>
      <div class="topbar-user" id="topbarUserMenu" onclick="toggleUserMenu()" style="cursor:pointer;position:relative">
        ${avatar(user.name, user.color, 36)}
        <div>
          <div class="user-name">${user.name || ''}</div>
          <div class="user-role">${user.role === 'hr' ? 'HR Manager' : user.role === 'admin' ? 'Administrator' : 'Employee'}</div>
        </div>
        <!-- User dropdown menu -->
        <div id="userDropdown" class="user-dropdown" style="display:none">
          <div class="user-dropdown-header">
            ${avatar(user.name, user.color, 42)}
            <div>
              <div style="font-weight:700;font-size:14px">${user.name || ''}</div>
              <div style="font-size:12px;color:var(--text-sm)">${user.role || ''}</div>
            </div>
          </div>
          <div class="user-dropdown-divider"></div>
          <a href="employees.html" class="user-dropdown-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </a>
          <a href="attendance.html" class="user-dropdown-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Check In/Out
          </a>
          <div class="user-dropdown-divider"></div>
          <a href="#" class="user-dropdown-item user-dropdown-danger" onclick="doLogout();return false;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </a>
        </div>
      </div>
    </div>`;
}

// ── Topbar button handlers ────────────────────────────────────
window.topbarNotif = function() {
  toast('No new notifications', 'info');
};
window.topbarApps = function() {
  const pages = [
    { label: 'Dashboard',   href: 'dashboard.html' },
    { label: 'Employees',   href: 'employees.html' },
    { label: 'Attendance',  href: 'attendance.html' },
    { label: 'Leave',       href: 'leave.html' },
    { label: 'Payroll',     href: 'payroll.html' },
  ];
  // Simple app switcher toast menu
  const existing = document.getElementById('appSwitcher');
  if (existing) { existing.remove(); return; }
  const menu = document.createElement('div');
  menu.id = 'appSwitcher';
  menu.style.cssText = 'position:fixed;top:66px;right:60px;background:#fff;border:1.5px solid var(--border);border-radius:12px;box-shadow:var(--shadow-lg);z-index:500;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px;min-width:200px';
  menu.innerHTML = pages.map(p =>
    `<a href="${p.href}" style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;font-size:13px;font-weight:600;color:var(--text-md);text-decoration:none;transition:background .15s" onmouseover="this.style.background='var(--primary-lt)';this.style.color='var(--primary)'" onmouseout="this.style.background='';this.style.color='var(--text-md)'">${p.label}</a>`
  ).join('');
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 50);
};
window.toggleUserMenu = function() {
  const dd = document.getElementById('userDropdown');
  if (!dd) return;
  const isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', (e) => {
      if (!document.getElementById('topbarUserMenu')?.contains(e.target)) {
        dd.style.display = 'none';
      }
    }, { once: true }), 50);
  }
};

// ── Mobile sidebar toggle ─────────────────────────────────────
function initMobileNav() {
  const mq = window.matchMedia('(max-width: 768px)');
  const btn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  // Inject backdrop
  if (!document.getElementById('sidebarBackdrop')) {
    const bd = document.createElement('div');
    bd.id = 'sidebarBackdrop';
    bd.className = 'sidebar-backdrop';
    bd.onclick = closeSidebar;
    document.body.appendChild(bd);
  }

  function apply(mobile) {
    if (btn) btn.style.display = mobile ? 'flex' : 'none';
  }

  apply(mq.matches);
  mq.addEventListener('change', e => { apply(e.matches); if (!e.matches) closeSidebar(); });
}

window.toggleSidebar = function() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar?.classList.toggle('open');
  backdrop?.classList.toggle('open');
};

window.closeSidebar = function() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('open');
};

// Close sidebar on nav item click (mobile)
document.addEventListener('click', e => {
  if (e.target.closest('.nav-item') || e.target.closest('.sidebar-checkin-btn')) {
    if (window.matchMedia('(max-width: 768px)').matches) closeSidebar();
  }
});

// Init after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  setTimeout(initMobileNav, 0);
}

window.doLogout = () => { Auth.clear(); window.location.href = 'index.html'; };
