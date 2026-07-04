/* ═══════════════════════════════════════════════════════════════
   HRMS API Client  — all data from real backend, zero hardcoding
   ═══════════════════════════════════════════════════════════════ */

const BASE = 'http://localhost:3000/api';

// ── Token storage ─────────────────────────────────────────────
export const Auth = {
  token:    () => sessionStorage.getItem('hrms_token'),
  user:     () => JSON.parse(sessionStorage.getItem('hrms_user') || 'null'),
  setSession(token, user) {
    sessionStorage.setItem('hrms_token', token);
    sessionStorage.setItem('hrms_user', JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem('hrms_token');
    sessionStorage.removeItem('hrms_user');
  },
  requireLogin() {
    if (!this.token()) { window.location.href = 'index.html'; }
  },
  isHR() {
    const u = this.user(); return u && (u.role === 'hr' || u.role === 'admin');
  }
};

// ── Core fetch wrapper ────────────────────────────────────────
export async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = Auth.token();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);

  const res = await fetch(BASE + path, opts);
  if (res.status === 401) { Auth.clear(); window.location.href = 'index.html'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const get  = (path)        => api('GET',    path);
export const post = (path, body)  => api('POST',   path, body);
export const put  = (path, body)  => api('PUT',    path, body);
export const del  = (path)        => api('DELETE', path);

// ── UI Helpers ────────────────────────────────────────────────
export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function avatar(name, color, size = 40) {
  return `<div class="emp-avatar" style="background:${color || '#5B2D8E'};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.floor(size*0.35)}px;color:#fff;flex-shrink:0">${initials(name)}</div>`;
}

const STATUS_LABELS = {
  present:'Present', absent:'Absent', half_day:'Half-Day', on_leave:'On Leave',
  pending:'Pending', approved:'Approved', rejected:'Rejected',
  draft:'Draft', confirmed:'Confirmed', paid:'Paid',
  ANNUAL:'Annual', SICK:'Sick', UNPAID:'Unpaid', CASUAL:'Casual',
};

export function badge(key, label) {
  const l = label || STATUS_LABELS[key] || key;
  const k = key?.toLowerCase().replace(/ /g,'_');
  return `<span class="badge badge-${k}">${l}</span>`;
}

export function toast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function formatHours(h) {
  if (!h) return '0h 00m';
  const hrs = Math.floor(h);
  const min = Math.round((h - hrs) * 60);
  return `${hrs}h ${String(min).padStart(2,'0')}m`;
}

export function renderSidebar(active) {
  const user = Auth.user();
  const isHR = Auth.isHR();
  const nav  = [
    { id:'dashboard', label:'Dashboard',      icon:'📊', href:'dashboard.html', hrOnly:true  },
    { id:'employees', label:'Employees',      icon:'👥', href:'employees.html', hrOnly:false },
    { id:'attendance',label:'Attendance',     icon:'📅', href:'attendance.html',hrOnly:false },
    { id:'leave',     label:'Leave/Time-Off', icon:'🏖️', href:'leave.html',     hrOnly:false },
    { id:'payroll',   label:'Payroll',        icon:'💰', href:'payroll.html',   hrOnly:false },
  ];
  const items = nav.filter(n => !n.hrOnly || isHR).map(n =>
    `<a href="${n.href}" class="nav-item ${active === n.id ? 'active' : ''}">
       <span class="nav-icon">${n.icon}</span>${n.label}
     </a>`
  ).join('');
  return `
    <div class="sidebar-brand">
      <div class="brand-title">Enterprise HRMS</div>
      <div class="brand-sub">${isHR ? 'Admin Portal' : 'Employee Portal'}</div>
    </div>
    <nav class="sidebar-nav">${items}</nav>
    <div class="sidebar-bottom">
      <a href="attendance.html" class="nav-item"><span class="nav-icon">🔄</span>Check In/Out</a>
      <a href="#" class="nav-item" onclick="doLogout();return false;"><span class="nav-icon">🚪</span>Sign Out</a>
    </div>`;
}

export function renderTopbar() {
  const user = Auth.user() || {};
  return `
    <div class="topbar-search">
      <span>🔍</span>
      <input type="text" placeholder="Search employees or records..." id="globalSearch" oninput="handleSearch(this.value)"/>
    </div>
    <div class="topbar-right">
      <span style="font-size:20px;cursor:pointer" title="Notifications">🔔</span>
      <div class="topbar-user">
        ${avatar(user.name, user.color, 36)}
        <div><div class="user-name">${user.name || ''}</div><div class="user-role">${user.role || ''}</div></div>
      </div>
    </div>`;
}

window.doLogout = function() {
  Auth.clear(); window.location.href = 'index.html';
};

window.handleSearch = function(val) {
  // each page can override this
  if (window.onGlobalSearch) window.onGlobalSearch(val);
};
