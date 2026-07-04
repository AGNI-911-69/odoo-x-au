import express   from 'express';
import cors      from 'cors';
import bcrypt    from 'bcrypt';
import jwt       from 'jsonwebtoken';
import db, { nextEmpCode } from './db.js';

const app    = express();
const PORT   = 3000;
const SECRET = 'hrms-jwt-secret-2026';

const COLORS = ['#5B2D8E','#E74C3C','#F39C12','#27AE60','#2980B9','#8E44AD','#16A085','#D35400','#1A252F','#2C3E50'];

app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

function hrOnly(req, res, next) {
  if (req.user.role === 'hr' || req.user.role === 'admin') return next();
  res.status(403).json({ error: 'HR or Admin access required' });
}

function logActivity(text, description, icon, category, empId = null) {
  db.prepare('INSERT INTO activity_log (text, description, icon, category, emp_id) VALUES (?,?,?,?,?)')
    .run(text, description, icon, category, empId);
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════
// Register (first-time admin setup or HR adding users)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'employee' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM employees WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const code  = nextEmpCode();
  const hash  = bcrypt.hashSync(password, 10);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const today = new Date().toISOString().slice(0, 10);

  try {
    const info = db.prepare(
      'INSERT INTO employees (code, name, email, password, role, color, joined) VALUES (?,?,?,?,?,?,?)'
    ).run(code, name, email, hash, role, color, today);

    const isFirst = db.prepare('SELECT COUNT(*) as c FROM employees').get().c === 1;
    logActivity(
      isFirst ? 'System Initialized' : 'New Account Created',
      `${name} (${role}) registered`,
      isFirst ? '🚀' : '👤',
      'employee',
      info.lastInsertRowid
    );

    const token = jwt.sign({ id: info.lastInsertRowid, role }, SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: info.lastInsertRowid, code, name, email, role, color, joined: today } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const emp = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);
  if (!emp || !bcrypt.compareSync(password, emp.password))
    return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: emp.id, role: emp.role }, SECRET, { expiresIn: '24h' });
  const { password: _, ...safe } = emp;
  logActivity('Login', `${emp.name} signed in`, '🔐', 'system', emp.id);
  res.json({ token, user: safe });
});

// Get current user
app.get('/api/auth/me', auth, (req, res) => {
  const emp = db.prepare('SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees WHERE id=?').get(req.user.id);
  if (!emp) return res.status(404).json({ error: 'User not found' });
  res.json(emp);
});

// Change own password
app.put('/api/auth/password', auth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password || new_password.length < 6)
    return res.status(400).json({ error: 'Invalid password data' });
  const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, emp.password))
    return res.status(401).json({ error: 'Current password is incorrect' });
  db.prepare('UPDATE employees SET password=? WHERE id=?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
//  EMPLOYEES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/employees', auth, (req, res) => {
  // Employee sees only own record; HR/Admin see all
  let rows;
  if (req.user.role === 'employee') {
    rows = db.prepare('SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees WHERE id=?').all(req.user.id);
  } else {
    rows = db.prepare('SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees ORDER BY name').all();
  }
  res.json(rows);
});

app.get('/api/employees/:id', auth, (req, res) => {
  if (req.user.role === 'employee' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Forbidden' });
  const emp = db.prepare('SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees WHERE id=?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

// HR adds new employee
app.post('/api/employees', auth, hrOnly, (req, res) => {
  const { name, email, password, phone, job, dept, role, salary, joined } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM employees WHERE email=?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const code  = nextEmpCode();
  const hash  = bcrypt.hashSync(password, 10);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const dateJoined = joined || new Date().toISOString().slice(0, 10);

  try {
    const info = db.prepare(
      'INSERT INTO employees (code,name,email,password,phone,job,dept,role,salary,color,joined) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(code, name, email, hash, phone||'', job||'', dept||'', role||'employee', salary||0, color, dateJoined);

    logActivity('New Employee Added', `${name} joined ${dept||''}`, '👤', 'employee', info.lastInsertRowid);

    const { password: _, ...safe } = db.prepare('SELECT * FROM employees WHERE id=?').get(info.lastInsertRowid);
    res.status(201).json(safe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update employee (HR=all fields, Employee=limited own fields)
app.put('/api/employees/:id', auth, (req, res) => {
  const targetId = parseInt(req.params.id);
  const isHR = req.user.role === 'hr' || req.user.role === 'admin';
  if (!isHR && req.user.id !== targetId) return res.status(403).json({ error: 'Forbidden' });

  const allowed = isHR
    ? ['name','phone','job','dept','role','salary','status','joined']
    : ['phone'];   // employees can only update their phone

  const updates = [];
  const vals    = [];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f}=?`); vals.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
  vals.push(targetId);
  db.prepare(`UPDATE employees SET ${updates.join(',')} WHERE id=?`).run(...vals);
  if (isHR) logActivity('Employee Updated', `Record updated for ID ${targetId}`, '✏️', 'employee');
  res.json({ success: true });
});

// Delete employee (admin only)
app.delete('/api/employees/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  db.prepare('DELETE FROM employees WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
//  ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/attendance', auth, (req, res) => {
  const { date, emp_id } = req.query;
  let sql = `SELECT a.*, e.name as emp_name, e.job as emp_job, e.color as emp_color
             FROM attendance a JOIN employees e ON a.emp_id = e.id WHERE 1=1`;
  const params = [];

  if (req.user.role === 'employee') {
    sql += ' AND a.emp_id = ?'; params.push(req.user.id);
  } else if (emp_id) {
    sql += ' AND a.emp_id = ?'; params.push(emp_id);
  }
  if (date) { sql += ' AND a.date = ?'; params.push(date); }
  sql += ' ORDER BY a.date DESC, e.name ASC';
  res.json(db.prepare(sql).all(...params));
});

// Check In
app.post('/api/attendance/checkin', auth, (req, res) => {
  const empId = (req.user.role !== 'employee' && req.body.emp_id) ? req.body.emp_id : req.user.id;
  const date  = new Date().toISOString().slice(0, 10);
  const time  = new Date().toTimeString().slice(0, 5);

  const existing = db.prepare('SELECT * FROM attendance WHERE emp_id=? AND date=?').get(empId, date);
  if (existing?.check_in) return res.status(400).json({ error: 'Already checked in today' });

  if (existing) {
    db.prepare('UPDATE attendance SET check_in=?, status=? WHERE id=?').run(time, 'present', existing.id);
    res.json({ id: existing.id, check_in: time });
  } else {
    const info = db.prepare('INSERT INTO attendance (emp_id,date,check_in,status) VALUES (?,?,?,?)').run(empId, date, time, 'present');
    res.json({ id: info.lastInsertRowid, check_in: time });
  }
  db.prepare('UPDATE employees SET status=? WHERE id=?').run('present', empId);
});

// Check Out
app.post('/api/attendance/checkout', auth, (req, res) => {
  const empId = (req.user.role !== 'employee' && req.body.emp_id) ? req.body.emp_id : req.user.id;
  const date  = new Date().toISOString().slice(0, 10);
  const time  = new Date().toTimeString().slice(0, 5);

  const att = db.prepare('SELECT * FROM attendance WHERE emp_id=? AND date=?').get(empId, date);
  if (!att?.check_in) return res.status(400).json({ error: 'Not checked in today' });
  if (att.check_out)  return res.status(400).json({ error: 'Already checked out' });

  const [ih, im] = att.check_in.split(':').map(Number);
  const [oh, om] = time.split(':').map(Number);
  const totalMin = (oh * 60 + om) - (ih * 60 + im);
  const hours    = totalMin / 60;
  const status   = hours >= 4 ? 'present' : 'half_day';

  db.prepare('UPDATE attendance SET check_out=?, hours=?, status=? WHERE id=?').run(time, hours, status, att.id);
  db.prepare('UPDATE employees SET status=? WHERE id=?').run(status, empId);
  res.json({ id: att.id, check_out: time, hours, status });
});

// ══════════════════════════════════════════════════════════════════════════════
//  LEAVE TYPES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/leave-types', auth, (req, res) => {
  res.json(db.prepare('SELECT * FROM leave_types').all());
});

// ══════════════════════════════════════════════════════════════════════════════
//  LEAVES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/leaves', auth, (req, res) => {
  let sql = `SELECT l.*, e.name as emp_name, e.job as emp_job, e.color as emp_color,
             lt.name as type_name, lt.color as type_color
             FROM leaves l
             JOIN employees e  ON l.emp_id = e.id
             JOIN leave_types lt ON l.leave_type = lt.code
             WHERE 1=1`;
  const params = [];
  if (req.user.role === 'employee') { sql += ' AND l.emp_id=?'; params.push(req.user.id); }
  if (req.query.status) { sql += ' AND l.status=?'; params.push(req.query.status); }
  sql += ' ORDER BY l.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/leaves', auth, (req, res) => {
  const { leave_type, date_from, date_to, reason } = req.body;
  if (!leave_type || !date_from || !date_to) return res.status(400).json({ error: 'Leave type and dates required' });
  if (date_to < date_from) return res.status(400).json({ error: 'End date must be after start date' });

  const days = Math.ceil((new Date(date_to) - new Date(date_from)) / 86400000) + 1;
  const emp  = db.prepare('SELECT name FROM employees WHERE id=?').get(req.user.id);

  try {
    const info = db.prepare(
      'INSERT INTO leaves (emp_id,leave_type,date_from,date_to,days,reason,status) VALUES (?,?,?,?,?,?,?)'
    ).run(req.user.id, leave_type, date_from, date_to, days, reason||'', 'pending');
    logActivity('Leave Requested', `${emp.name} applied for ${leave_type} leave (${days} day${days>1?'s':''})`, '📋', 'leave', req.user.id);
    res.status(201).json({ id: info.lastInsertRowid, days, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/leaves/:id/approve', auth, hrOnly, (req, res) => {
  const leave = db.prepare('SELECT l.*, e.name FROM leaves l JOIN employees e ON l.emp_id=e.id WHERE l.id=?').get(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  db.prepare('UPDATE leaves SET status=?,approved_by=?,approved_at=? WHERE id=?')
    .run('approved', req.user.id, new Date().toISOString(), req.params.id);
  logActivity('Leave Approved', `${leave.name}'s ${leave.leave_type} leave approved`, '✅', 'leave');
  res.json({ success: true });
});

app.post('/api/leaves/:id/reject', auth, hrOnly, (req, res) => {
  const leave = db.prepare('SELECT l.*, e.name FROM leaves l JOIN employees e ON l.emp_id=e.id WHERE l.id=?').get(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  db.prepare('UPDATE leaves SET status=?,rejection_reason=? WHERE id=?')
    .run('rejected', req.body.reason||'', req.params.id);
  logActivity('Leave Rejected', `${leave.name}'s ${leave.leave_type} leave rejected`, '❌', 'leave');
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
//  PAYROLL
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/payroll', auth, (req, res) => {
  let sql = 'SELECT p.*, e.name as emp_name FROM payroll p JOIN employees e ON p.emp_id=e.id WHERE 1=1';
  const params = [];
  if (req.user.role === 'employee') { sql += ' AND p.emp_id=?'; params.push(req.user.id); }
  if (req.query.month) { sql += ' AND p.month=?'; params.push(req.query.month); }
  sql += ' ORDER BY p.month DESC, e.name ASC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/payroll', auth, hrOnly, (req, res) => {
  const { emp_id, month, basic, hra, transport, medical, other, tax, pf } = req.body;
  if (!emp_id || !month || !basic) return res.status(400).json({ error: 'Employee, month and basic salary required' });
  try {
    const info = db.prepare(
      'INSERT INTO payroll (emp_id,month,basic,hra,transport,medical,other,tax,pf,state) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(emp_id, month, basic, hra||0, transport||0, medical||0, other||0, tax||0, pf||0, 'draft');
    const emp = db.prepare('SELECT name FROM employees WHERE id=?').get(emp_id);
    logActivity('Payroll Created', `${month} payroll created for ${emp.name}`, '💰', 'payroll');
    res.status(201).json({ id: info.lastInsertRowid, state: 'draft' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/payroll/:id/confirm', auth, hrOnly, (req, res) => {
  db.prepare('UPDATE payroll SET state=? WHERE id=?').run('confirmed', req.params.id);
  logActivity('Payroll Confirmed', `Payroll record #${req.params.id} confirmed`, '✅', 'payroll');
  res.json({ success: true });
});

app.post('/api/payroll/:id/markpaid', auth, hrOnly, (req, res) => {
  db.prepare('UPDATE payroll SET state=?,payment_date=? WHERE id=?').run('paid', new Date().toISOString().slice(0,10), req.params.id);
  logActivity('Payroll Paid', `Payroll record #${req.params.id} marked as paid`, '💸', 'payroll');
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/stats', auth, (req, res) => {
  const today   = new Date().toISOString().slice(0, 10);
  const totalEmp= db.prepare('SELECT COUNT(*) as c FROM employees').get().c;
  const todayAtt= db.prepare('SELECT status FROM attendance WHERE date=?').all(today);
  const present = todayAtt.filter(a => a.status === 'present').length;
  const halfday = todayAtt.filter(a => a.status === 'half_day').length;
  const absent  = todayAtt.filter(a => a.status === 'absent').length;
  const onLeave = todayAtt.filter(a => a.status === 'on_leave').length;
  const pendingLeaves = db.prepare("SELECT COUNT(*) as c FROM leaves WHERE status='pending'").get().c;
  // upcoming birthdays — not stored yet, placeholder
  const activity = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 8').all();
  res.json({ totalEmp, present, halfday, absent, onLeave, lateArrivals: halfday, pendingLeaves, activity });
});

// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  HRMS API  →  http://localhost:${PORT}   ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
});
