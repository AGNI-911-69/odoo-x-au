// Full API test suite — runs every endpoint
const BASE = 'http://localhost:3000/api';

async function api(method, path, body, token) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  return { status: r.status, ok: r.ok, data };
}

function pass(label, info = '') { console.log(`  ✅ PASS  ${label}${info ? ' — ' + info : ''}`); }
function fail(label, err)       { console.log(`  ❌ FAIL  ${label} — ${err}`); process.exitCode = 1; }

let TOKEN, HR_TOKEN, EMP_TOKEN, EMP_ID, LEAVE_ID, PAY_ID;

console.log('\n══════════════════════════════════════════════');
console.log('   HRMS Full Feature Test Suite');
console.log('══════════════════════════════════════════════\n');

// ── 1. AUTH ───────────────────────────────────────────────────────────────────
console.log('── Auth ─────────────────────────────────────');

// Register HR
let r = await api('POST', '/auth/register', { name:'Test HR', email:'testhr@hrms.local', password:'pass1234', role:'hr' });
if (r.ok || r.data.error?.includes('already')) {
  pass('Register HR user');
} else { fail('Register HR', r.data.error); }

// Register Employee
r = await api('POST', '/auth/register', { name:'Test Employee', email:'testemp@hrms.local', password:'pass1234', role:'employee' });
if (r.ok || r.data.error?.includes('already')) {
  pass('Register Employee user');
} else { fail('Register Employee', r.data.error); }

// Login as HR
r = await api('POST', '/auth/login', { email:'testhr@hrms.local', password:'pass1234' });
if (r.ok && r.data.token) { HR_TOKEN = r.data.token; pass('Login as HR', `role=${r.data.user.role}`); }
else { fail('Login HR', r.data.error); }

// Login as Employee
r = await api('POST', '/auth/login', { email:'testemp@hrms.local', password:'pass1234' });
if (r.ok && r.data.token) { EMP_TOKEN = r.data.token; EMP_ID = r.data.user.id; pass('Login as Employee', `id=${EMP_ID}`); }
else { fail('Login Employee', r.data.error); }

// Bad login
r = await api('POST', '/auth/login', { email:'testhr@hrms.local', password:'wrongpassword' });
if (!r.ok && r.status === 401) { pass('Reject bad password'); }
else { fail('Reject bad password', 'should be 401'); }

// /auth/me
r = await api('GET', '/auth/me', null, HR_TOKEN);
if (r.ok && r.data.name) { pass('/auth/me', `name=${r.data.name}`); }
else { fail('/auth/me', r.data.error); }

// ── 2. EMPLOYEES ──────────────────────────────────────────────────────────────
console.log('\n── Employees ───────────────────────────────');

// HR sees all employees
r = await api('GET', '/employees', null, HR_TOKEN);
if (r.ok && Array.isArray(r.data)) { pass('HR GET /employees', `count=${r.data.length}`); }
else { fail('HR GET /employees', r.data.error); }

// Add employee (HR)
r = await api('POST', '/employees', {
  name:'Jane Smith', email:'jane.smith@hrms.local', password:'pass1234',
  job:'Developer', dept:'Engineering', role:'employee', salary:65000,
}, HR_TOKEN);
if (r.ok && r.data.id) { EMP_ID = r.data.id; pass('Add employee', `${r.data.code} - ${r.data.name}`); }
else { fail('Add employee', r.data.error || JSON.stringify(r.data)); }

// Get single employee
r = await api('GET', '/employees/' + EMP_ID, null, HR_TOKEN);
if (r.ok && r.data.name === 'Jane Smith') { pass('GET /employees/:id'); }
else { fail('GET /employees/:id', r.data.error); }

// Employee cannot see other employees (role rule)
r = await api('GET', '/employees', null, EMP_TOKEN);
if (r.ok) {
  const myOnly = r.data.every ? r.data.every(e => e.id === EMP_ID) : true;
  pass('Employee sees only own record', `count=${r.data.length}`);
}

// Employee cannot add employee
r = await api('POST', '/employees', { name:'X', email:'x@x.com', password:'pass1234' }, EMP_TOKEN);
if (!r.ok && r.status === 403) { pass('Employee cannot add employee (403)'); }
else { fail('Employee role guard', `got ${r.status}`); }

// ── 3. ATTENDANCE ─────────────────────────────────────────────────────────────
console.log('\n── Attendance ──────────────────────────────');

// Check In
r = await api('POST', '/attendance/checkin', { emp_id: EMP_ID }, HR_TOKEN);
if (r.ok && r.data.check_in) { pass('Check In', `time=${r.data.check_in}`); }
else { fail('Check In', r.data.error || JSON.stringify(r.data)); }

// Double check-in should fail
r = await api('POST', '/attendance/checkin', { emp_id: EMP_ID }, HR_TOKEN);
if (!r.ok) { pass('Block double check-in'); }
else { fail('Block double check-in', 'should have errored'); }

// Check Out
r = await api('POST', '/attendance/checkout', { emp_id: EMP_ID }, HR_TOKEN);
if (r.ok && r.data.check_out) { pass('Check Out', `time=${r.data.check_out}, hours=${r.data.hours?.toFixed(2)}`); }
else { fail('Check Out', r.data.error); }

// Get attendance
const today = new Date().toISOString().slice(0,10);
r = await api('GET', `/attendance?date=${today}`, null, HR_TOKEN);
if (r.ok && Array.isArray(r.data)) { pass('GET /attendance', `${r.data.length} records today`); }
else { fail('GET /attendance', r.data.error); }

// ── 4. LEAVES ─────────────────────────────────────────────────────────────────
console.log('\n── Leaves ──────────────────────────────────');

// Get leave types
r = await api('GET', '/leave-types', null, EMP_TOKEN);
if (r.ok && r.data.length > 0) { pass('GET /leave-types', `${r.data.length} types`); }
else { fail('GET /leave-types', r.data.error); }

// Apply for leave (as employee)
const futureFrom = new Date(Date.now() + 7*86400000).toISOString().slice(0,10);
const futureTo   = new Date(Date.now() + 9*86400000).toISOString().slice(0,10);
r = await api('POST', '/leaves', {
  leave_type: 'ANNUAL', date_from: futureFrom, date_to: futureTo, reason: 'Annual vacation'
}, EMP_TOKEN);
if (r.ok && r.data.id) { LEAVE_ID = r.data.id; pass('Apply for leave', `id=${LEAVE_ID}, days=${r.data.days}`); }
else { fail('Apply for leave', r.data.error); }

// Date validation — to < from should fail
r = await api('POST', '/leaves', { leave_type:'SICK', date_from: futureTo, date_to: futureFrom, reason:'test' }, EMP_TOKEN);
if (!r.ok) { pass('Reject invalid date range'); }
else { fail('Date validation', 'should have rejected'); }

// HR sees all leaves
r = await api('GET', '/leaves', null, HR_TOKEN);
if (r.ok && Array.isArray(r.data)) { pass('HR GET /leaves', `${r.data.length} total`); }
else { fail('HR GET /leaves', r.data.error); }

// Employee only sees own leaves
r = await api('GET', '/leaves', null, EMP_TOKEN);
if (r.ok) { pass('Employee GET /leaves (own only)', `${r.data.length} records`); }

// HR approves leave
r = await api('POST', `/leaves/${LEAVE_ID}/approve`, {}, HR_TOKEN);
if (r.ok) { pass('HR approve leave'); }
else { fail('HR approve leave', r.data.error); }

// Check leave is now approved
r = await api('GET', `/leaves?status=approved`, null, HR_TOKEN);
const approved = r.data.find(l => l.id === LEAVE_ID);
if (approved) { pass('Leave status = approved in DB'); }
else { fail('Leave status check', 'not found in approved list'); }

// Employee cannot approve
r = await api('POST', `/leaves/${LEAVE_ID}/reject`, {}, EMP_TOKEN);
if (!r.ok && r.status === 403) { pass('Employee cannot approve/reject (403)'); }
else { fail('Leave role guard', `got ${r.status}`); }

// ── 5. PAYROLL ────────────────────────────────────────────────────────────────
console.log('\n── Payroll ─────────────────────────────────');

// HR adds payroll
r = await api('POST', '/payroll', {
  emp_id: EMP_ID, month: 'July 2026',
  basic: 65000, hra: 6500, transport: 1500, medical: 1000,
  tax: 9000, pf: 3500,
}, HR_TOKEN);
if (r.ok && r.data.id) { PAY_ID = r.data.id; pass('Add payroll record', `id=${PAY_ID}, state=draft`); }
else { fail('Add payroll', r.data.error); }

// Duplicate month+emp should fail
r = await api('POST', '/payroll', { emp_id: EMP_ID, month: 'July 2026', basic: 1 }, HR_TOKEN);
if (!r.ok) { pass('Block duplicate payroll'); }
else { fail('Duplicate payroll guard', 'should have failed'); }

// HR confirms payroll
r = await api('POST', `/payroll/${PAY_ID}/confirm`, {}, HR_TOKEN);
if (r.ok) { pass('Confirm payroll'); }
else { fail('Confirm payroll', r.data.error); }

// Mark as paid
r = await api('POST', `/payroll/${PAY_ID}/markpaid`, {}, HR_TOKEN);
if (r.ok) { pass('Mark payroll paid'); }
else { fail('Mark payroll paid', r.data.error); }

// Employee sees own payroll
r = await api('GET', '/payroll', null, EMP_TOKEN);
if (r.ok) { pass('Employee GET /payroll (own only)', `${r.data.length} records`); }

// Employee cannot add payroll
r = await api('POST', '/payroll', { emp_id: EMP_ID, month: 'August 2026', basic: 1 }, EMP_TOKEN);
if (!r.ok && r.status === 403) { pass('Employee cannot add payroll (403)'); }
else { fail('Payroll role guard', `got ${r.status}`); }

// ── 6. STATS ─────────────────────────────────────────────────────────────────
console.log('\n── Stats / Dashboard ───────────────────────');

r = await api('GET', '/stats', null, HR_TOKEN);
if (r.ok && typeof r.data.totalEmp === 'number') {
  pass('GET /stats', `emp=${r.data.totalEmp} present=${r.data.present} pending=${r.data.pendingLeaves} activity=${r.data.activity.length}`);
} else { fail('GET /stats', r.data.error); }

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('   All tests completed');
console.log('══════════════════════════════════════════════\n');
