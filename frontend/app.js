/* ═══════════════════════════════════════════════
   Enterprise HRMS — App Data & Utilities
   ═══════════════════════════════════════════════ */

const HRMS = (() => {

  /* ── Seed Data ────────────────────────────────── */
  const SEED_EMPLOYEES = [
    { id:1, code:'EMP-4829', name:'Sarah Jenkins',  job:'Senior Frontend Developer', dept:'Product & Engineering', role:'hr',       status:'present',  joined:'Mar 12, 2021', salary:85000, email:'sarah.jenkins@hrms.demo',    phone:'+1-555-0101', color:'#5B2D8E' },
    { id:2, code:'EMP-3102', name:'Michael Chen',   job:'Operations Manager',        dept:'Global Operations',     role:'employee', status:'absent',   joined:'Nov 05, 2019', salary:72000, email:'michael.chen@hrms.demo',     phone:'+1-555-0102', color:'#E74C3C' },
    { id:3, code:'EMP-9284', name:'Elena Rodriguez',job:'HR Specialist',             dept:'Human Resources',       role:'hr',       status:'on_leave', joined:'Jan 20, 2023', salary:68000, email:'elena.rodriguez@hrms.demo',  phone:'+1-555-0103', color:'#F39C12' },
    { id:4, code:'EMP-5521', name:'David Wilson',   job:'UX Designer',               dept:'Product & Design',      role:'employee', status:'present',  joined:'Aug 15, 2022', salary:65000, email:'david.wilson@hrms.demo',     phone:'+1-555-0104', color:'#27AE60' },
    { id:5, code:'EMP-1004', name:'Patricia Moore', job:'CFO',                       dept:'Finance & Accounting',  role:'admin',    status:'present',  joined:'Feb 02, 2015', salary:120000,email:'patricia.moore@hrms.demo',   phone:'+1-555-0105', color:'#2980B9' },
    { id:6, code:'EMP-6712', name:'Jordan Smith',   job:'Data Analyst',              dept:'Business Intelligence', role:'employee', status:'half_day', joined:'Sep 30, 2021', salary:62000, email:'jordan.smith@hrms.demo',     phone:'+1-555-0106', color:'#8E44AD' },
    { id:7, code:'EMP-0891', name:'Robert Wilson',  job:'Project Manager',           dept:'PMO',                   role:'employee', status:'present',  joined:'Jun 01, 2020', salary:78000, email:'robert.wilson@hrms.demo',    phone:'+1-555-0107', color:'#16A085' },
  ];

  const today = new Date().toISOString().slice(0,10);

  const SEED_ATTENDANCE = [
    { id:1, empId:1, date:today, checkIn:'08:42', checkOut:'17:15', status:'present',  hours:'8h 33m' },
    { id:2, empId:2, date:today, checkIn:'09:15', checkOut:'13:00', status:'half_day', hours:'3h 45m' },
    { id:3, empId:3, date:today, checkIn:'--:--', checkOut:'--:--', status:'on_leave', hours:'0h 00m' },
    { id:4, empId:4, date:today, checkIn:'--:--', checkOut:'--:--', status:'absent',   hours:'0h 00m' },
    { id:5, empId:5, date:today, checkIn:'08:00', checkOut:'17:00', status:'present',  hours:'9h 00m' },
    { id:6, empId:6, date:today, checkIn:'09:30', checkOut:'13:30', status:'half_day', hours:'4h 00m' },
    { id:7, empId:7, date:today, checkIn:'08:55', checkOut:'17:30', status:'present',  hours:'8h 35m' },
  ];

  const SEED_LEAVES = [
    { id:1, empId:2, empName:'Michael Chen',   empJob:'Marketing Executive',  type:'annual', typeLabel:'Annual',  dateFrom:'Oct 25, 2026', dateTo:'Oct 29, 2026', days:5,   reason:'Family vacation scheduled. All tasks for Q4 launch are delegated and on track.', status:'pending' },
    { id:2, empId:3, empName:'Elena Rodriguez',empJob:'Lead Designer',         type:'sick',   typeLabel:'Sick',    dateFrom:'Today',        dateTo:'Oct 15, 2026', days:2,   reason:'Sudden viral fever. Medical certificate will be uploaded upon return.',           status:'pending' },
    { id:3, empId:7, empName:'Robert Wilson',  empJob:'Project Manager',       type:'unpaid', typeLabel:'Unpaid',  dateFrom:'Nov 02, 2026', dateTo:'Nov 03, 2026', days:1.5, reason:'Attending a personal certification seminar that overlaps with work hours.',        status:'pending' },
    { id:4, empId:4, empName:'David Wilson',   empJob:'UX Designer',           type:'annual', typeLabel:'Annual',  dateFrom:'Sep 10, 2026', dateTo:'Sep 14, 2026', days:5,   reason:'Annual leave taken.',                                                               status:'approved' },
    { id:5, empId:6, empName:'Jordan Smith',   empJob:'Data Analyst',          type:'casual', typeLabel:'Casual',  dateFrom:'Aug 20, 2026', dateTo:'Aug 20, 2026', days:1,   reason:'Personal work.',                                                                     status:'rejected' },
  ];

  const SEED_PAYROLL = [
    { id:1, empId:1, empName:'Sarah Jenkins',  month:'October 2026', basic:85000, hra:8500,  transport:2000, medical:1500, other:0, tax:12000, pf:5000, state:'confirmed' },
    { id:2, empId:2, empName:'Michael Chen',   month:'October 2026', basic:72000, hra:7200,  transport:1800, medical:1200, other:0, tax:9500,  pf:4000, state:'draft'     },
    { id:3, empId:5, empName:'Patricia Moore', month:'October 2026', basic:120000,hra:15000, transport:3000, medical:2500, other:0, tax:22000, pf:8000, state:'paid'      },
    { id:4, empId:4, empName:'David Wilson',   month:'October 2026', basic:65000, hra:6500,  transport:1500, medical:1000, other:0, tax:8000,  pf:3500, state:'draft'     },
    { id:5, empId:7, empName:'Robert Wilson',  month:'October 2026', basic:78000, hra:7800,  transport:2200, medical:1200, other:0, tax:10000, pf:4500, state:'confirmed' },
  ];

  const SEED_ACTIVITY = [
    { icon:'👤', cls:'purple', text:'New Employee Added',        desc:'Marcus Miller joined the Engineering team.',      time:'2 hours ago' },
    { icon:'💰', cls:'green',  text:'Payroll Finalized',         desc:'Q3 Bonus distribution approved by Finance.',      time:'5 hours ago' },
    { icon:'📅', cls:'blue',   text:'Holiday Calendar Updated',  desc:'Public holidays for 2024 have been published.',   time:'Yesterday'   },
    { icon:'⚙️', cls:'gray',   text:'System Maintenance',        desc:'Scheduled database optimization completed.',       time:'2 days ago'  },
  ];

  /* ── Storage helpers ──────────────────────────── */
  function load(key, fallback) {
    try { const v = localStorage.getItem('hrms_' + key); return v ? JSON.parse(v) : fallback; }
    catch(e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem('hrms_' + key, JSON.stringify(val)); } catch(e) {}
  }

  /* ── Init storage with seeds ──────────────────── */
  function init() {
    if (!localStorage.getItem('hrms_init')) {
      save('employees',  SEED_EMPLOYEES);
      save('attendance', SEED_ATTENDANCE);
      save('leaves',     SEED_LEAVES);
      save('payroll',    SEED_PAYROLL);
      save('activity',   SEED_ACTIVITY);
      save('user',       { name:'Sarah Jenkins', role:'HR Manager', empId:1 });
      localStorage.setItem('hrms_init', '1');
    }
  }

  /* ── Auth ─────────────────────────────────────── */
  function login(email, password, role) {
    const emp = load('employees', SEED_EMPLOYEES).find(e => e.email === email);
    if (!emp) return false;
    if (password.length < 4) return false;
    save('user', { name: emp.name, role: role === 'hr' ? 'HR Manager' : 'Employee', empId: emp.id, roleKey: role });
    return true;
  }
  function logout() { localStorage.removeItem('hrms_user'); window.location.href = 'index.html'; }
  function getUser() { return load('user', null); }
  function requireLogin() { if (!getUser()) window.location.href = 'index.html'; }

  /* ── Data accessors ───────────────────────────── */
  function getEmployees()  { return load('employees',  SEED_EMPLOYEES);  }
  function getAttendance() { return load('attendance', SEED_ATTENDANCE); }
  function getLeaves()     { return load('leaves',     SEED_LEAVES);     }
  function getPayroll()    { return load('payroll',    SEED_PAYROLL);    }
  function getActivity()   { return load('activity',   SEED_ACTIVITY);   }

  function getEmployee(id) { return getEmployees().find(e => e.id === id); }

  /* ── Mutations ────────────────────────────────── */
  function approveLeave(id) {
    const leaves = getLeaves();
    const l = leaves.find(x => x.id === id);
    if (l) { l.status = 'approved'; save('leaves', leaves); }
  }
  function rejectLeave(id) {
    const leaves = getLeaves();
    const l = leaves.find(x => x.id === id);
    if (l) { l.status = 'rejected'; save('leaves', leaves); }
  }
  function checkIn(empId) {
    const att = getAttendance();
    const rec = att.find(a => a.empId === empId && a.date === today);
    const now = new Date(); const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (rec) { rec.checkIn = hm; rec.status = 'present'; save('attendance', att); return hm; }
    const newRec = { id: Date.now(), empId, date: today, checkIn: hm, checkOut:'--:--', status:'present', hours:'0h 00m' };
    att.push(newRec); save('attendance', att); return hm;
  }
  function checkOut(empId) {
    const att = getAttendance();
    const rec = att.find(a => a.empId === empId && a.date === today);
    const now = new Date(); const hm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    if (rec) {
      rec.checkOut = hm;
      if (rec.checkIn && rec.checkIn !== '--:--') {
        const [ih, im] = rec.checkIn.split(':').map(Number);
        const [oh, om] = hm.split(':').map(Number);
        const totalMin = (oh * 60 + om) - (ih * 60 + im);
        const h = Math.floor(totalMin / 60), m = totalMin % 60;
        rec.hours = `${h}h ${String(m).padStart(2,'0')}m`;
        rec.status = h >= 4 ? 'present' : 'half_day';
      }
      save('attendance', att);
    }
    return hm;
  }
  function addEmployee(emp) {
    const emps = getEmployees();
    emp.id = Date.now();
    emp.code = 'EMP-' + String(Math.floor(1000 + Math.random() * 9000));
    emp.color = ['#5B2D8E','#E74C3C','#F39C12','#27AE60','#2980B9','#8E44AD','#16A085'][emps.length % 7];
    emps.push(emp); save('employees', emps); return emp;
  }
  function addLeave(leave) {
    const leaves = getLeaves();
    leave.id = Date.now(); leave.status = 'pending';
    leaves.unshift(leave); save('leaves', leaves);
  }

  /* ── UI helpers ───────────────────────────────── */
  function initials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  }
  function badgeHtml(status, label) {
    const map = { present:'Present', absent:'Absent', half_day:'Half-Day', on_leave:'On Leave',
                  pending:'Pending', approved:'Approved', rejected:'Rejected',
                  annual:'Annual', sick:'Sick', unpaid:'Unpaid', casual:'Casual',
                  paid:'Paid', confirmed:'Confirmed', draft:'Draft' };
    const l = label || map[status] || status;
    return `<span class="badge badge-${status}">${l}</span>`;
  }
  function toast(msg, type='success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = `toast ${type}`;
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => t.classList.remove('show'), 3000);
  }
  function renderSidebar(active) {
    const user = getUser();
    const isHR = user && (user.roleKey === 'hr' || user.roleKey === 'admin');
    const nav = [
      { id:'dashboard', label:'Dashboard',     icon:'📊', href:'dashboard.html', hrOnly:true },
      { id:'employees', label:'Employees',     icon:'👥', href:'employees.html', hrOnly:false },
      { id:'attendance',label:'Attendance',    icon:'📅', href:'attendance.html',hrOnly:false },
      { id:'leave',     label:'Leave/Time-Off',icon:'🏖️', href:'leave.html',     hrOnly:false },
      { id:'payroll',   label:'Payroll',       icon:'💰', href:'payroll.html',   hrOnly:false },
    ];
    const items = nav.filter(n => !n.hrOnly || isHR).map(n =>
      `<a href="${n.href}" class="nav-item ${active===n.id?'active':''}">
         <span class="nav-icon">${n.icon}</span>${n.label}
       </a>`
    ).join('');
    const bottom = `
      <a href="#" class="nav-item" onclick="HRMS.logout();return false;"><span class="nav-icon">🚪</span>Sign Out</a>
    `;
    return `
      <div class="sidebar-brand">
        <div class="brand-title">Enterprise HRMS</div>
        <div class="brand-sub">${isHR ? 'Admin Portal' : 'Employee Portal'}</div>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      <div class="sidebar-bottom">${bottom}</div>
    `;
  }
  function renderTopbar() {
    const user = getUser() || { name:'Guest', role:'' };
    return `
      <div class="topbar-search">
        <span>🔍</span>
        <input type="text" placeholder="Search employees or records..."/>
      </div>
      <div class="topbar-right">
        <span style="font-size:20px;cursor:pointer">🔔</span>
        <div class="topbar-user">
          <div class="user-avatar">${initials(user.name)}</div>
          <div><div class="user-name">${user.name}</div><div class="user-role">${user.role}</div></div>
        </div>
      </div>
    `;
  }

  return { init, login, logout, getUser, requireLogin,
           getEmployees, getAttendance, getLeaves, getPayroll, getActivity, getEmployee,
           approveLeave, rejectLeave, checkIn, checkOut, addEmployee, addLeave,
           initials, badgeHtml, toast, renderSidebar, renderTopbar };
})();

HRMS.init();
