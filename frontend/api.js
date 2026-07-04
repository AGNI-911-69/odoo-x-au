/* ================================================================
   HRMS API Client — JWT auth, real backend, zero hardcoded data
   ================================================================ */

const BASE = 'http://localhost:3000/api';

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
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const token = Auth.token();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body)  opts.body = JSON.stringify(body);
  const res  = await fetch(BASE + path, opts);
  if (res.status === 401) { Auth.clear(); window.location.href = 'index.html'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
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
      <div class="brand-title">Enterprise HRMS</div>
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
    <div class="topbar-search">
      ${icons.search}
      <input type="text" placeholder="Search employees or records…" id="globalSearch" autocomplete="off" oninput="if(window.onGlobalSearch)onGlobalSearch(this.value)"/>
    </div>
    <div class="topbar-right">
      <div class="topbar-icon">${icons.bell}</div>
      <div class="topbar-icon">${icons.grid}</div>
      <div class="topbar-user">
        ${avatar(user.name, user.color, 36)}
        <div>
          <div class="user-name">${user.name || ''}</div>
          <div class="user-role">${user.role === 'hr' ? 'HR Manager' : user.role === 'admin' ? 'Administrator' : 'Employee'}</div>
        </div>
      </div>
    </div>`;
}

window.doLogout = () => { Auth.clear(); window.location.href = 'index.html'; };
