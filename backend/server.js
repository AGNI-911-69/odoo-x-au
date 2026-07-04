import express   from 'express';
import cors      from 'cors';
import bcrypt    from 'bcrypt';
import jwt       from 'jsonwebtoken';
import pool, { nextEmpCode } from './db.js';

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'hrms-jwt-secret-2026';
const COLORS = ['#5B2D8E','#E74C3C','#F39C12','#27AE60','#2980B9','#8E44AD','#16A085'];

app.use(cors({
  origin: [
    'https://odoo-x-au.vercel.app',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.get('/',       (req, res) => res.json({ service: 'HRMS API', status: 'running' }));

// ── Auth Middleware ───────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}
function hrOnly(req, res, next) {
  if (req.user.role === 'hr' || req.user.role === 'admin') return next();
  res.status(403).json({ error: 'HR or Admin access required' });
}
async function logActivity(text, description, icon, category, empId = null) {
  try {
    await pool.query(
      'INSERT INTO activity_log (text, description, icon, category, emp_id) VALUES ($1,$2,$3,$4,$5)',
      [text, description, icon, category, empId]
    );
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await pool.query('SELECT id FROM employees WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const code  = await nextEmpCode();
    const hash  = bcrypt.hashSync(password, 10);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const today = new Date().toISOString().slice(0, 10);

    const r = await pool.query(
      `INSERT INTO employees (code,name,email,password,role,color,joined)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,code,name,email,role,color,joined`,
      [code, name, email, hash, role, color, today]
    );
    const emp = r.rows[0];
    const token = jwt.sign({ id: emp.id, role: emp.role }, SECRET, { expiresIn: '24h' });
    await logActivity('New Account Created', `${name} (${role}) registered`, '👤', 'employee', emp.id);
    res.status(201).json({ token, user: emp });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const r = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
    const emp = r.rows[0];
    if (!emp) return res.status(401).json({ error: 'Invalid email or password' });
    if (!bcrypt.compareSync(password, emp.password)) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: emp.id, role: emp.role }, SECRET, { expiresIn: '24h' });
    const { password: _, ...safe } = emp;
    await logActivity('Login', `${emp.name} signed in`, '🔐', 'system', emp.id);
    res.json({ token, user: safe });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees WHERE id=$1',
      [req.user.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  EMPLOYEES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/employees', auth, async (req, res) => {
  try {
    let r;
    if (req.user.role === 'employee') {
      r = await pool.query('SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees WHERE id=$1', [req.user.id]);
    } else {
      r = await pool.query('SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees ORDER BY name');
    }
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/employees/:id', auth, async (req, res) => {
  try {
    if (req.user.role === 'employee' && req.user.id !== parseInt(req.params.id))
      return res.status(403).json({ error: 'Forbidden' });
    const r = await pool.query(
      'SELECT id,code,name,email,phone,job,dept,role,status,joined,salary,color FROM employees WHERE id=$1',
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', auth, hrOnly, async (req, res) => {
  try {
    const { name, email, password, phone, job, dept, role, salary, joined } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const exists = await pool.query('SELECT id FROM employees WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already exists' });

    const code  = await nextEmpCode();
    const hash  = bcrypt.hashSync(password, 10);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const dateJ = joined || new Date().toISOString().slice(0, 10);

    const r = await pool.query(
      `INSERT INTO employees (code,name,email,password,phone,job,dept,role,salary,color,joined)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id,code,name,email,phone,job,dept,role,salary,color,joined,status`,
      [code, name, email, hash, phone||'', job||'', dept||'', role||'employee', salary||0, color, dateJ]
    );
    await logActivity('New Employee Added', `${name} joined ${dept||''}`, '👤', 'employee', r.rows[0].id);
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/employees/:id', auth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const isHR = req.user.role === 'hr' || req.user.role === 'admin';
    if (!isHR && req.user.id !== targetId) return res.status(403).json({ error: 'Forbidden' });
    const allowed = isHR ? ['name','phone','job','dept','role','salary','status','joined'] : ['phone'];
    const updates = [], vals = [];
    allowed.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=$${vals.length+1}`); vals.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(targetId);
    await pool.query(`UPDATE employees SET ${updates.join(',')} WHERE id=$${vals.length}`, vals);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/employees/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await pool.query('DELETE FROM employees WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ATTENDANCE
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/attendance', auth, async (req, res) => {
  try {
    const { date, emp_id } = req.query;
    let sql = `SELECT a.*, e.name as emp_name, e.job as emp_job, e.color as emp_color
               FROM attendance a JOIN employees e ON a.emp_id = e.id WHERE 1=1`;
    const params = [];
    if (req.user.role === 'employee') { sql += ` AND a.emp_id = $${params.length+1}`; params.push(req.user.id); }
    else if (emp_id) { sql += ` AND a.emp_id = $${params.length+1}`; params.push(emp_id); }
    if (date) { sql += ` AND a.date = $${params.length+1}`; params.push(date); }
    sql += ' ORDER BY a.date DESC, e.name ASC';
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/checkin', auth, async (req, res) => {
  try {
    const empId = (req.user.role !== 'employee' && req.body.emp_id) ? req.body.emp_id : req.user.id;
    const date  = new Date().toISOString().slice(0, 10);
    const time  = new Date().toTimeString().slice(0, 5);
    const ex    = await pool.query('SELECT * FROM attendance WHERE emp_id=$1 AND date=$2', [empId, date]);
    if (ex.rows[0]?.check_in) return res.status(400).json({ error: 'Already checked in today' });
    if (ex.rows.length) {
      await pool.query('UPDATE attendance SET check_in=$1, status=$2 WHERE id=$3', [time, 'present', ex.rows[0].id]);
      res.json({ id: ex.rows[0].id, check_in: time });
    } else {
      const r = await pool.query('INSERT INTO attendance (emp_id,date,check_in,status) VALUES ($1,$2,$3,$4) RETURNING id', [empId, date, time, 'present']);
      res.json({ id: r.rows[0].id, check_in: time });
    }
    await pool.query('UPDATE employees SET status=$1 WHERE id=$2', ['present', empId]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/checkout', auth, async (req, res) => {
  try {
    const empId = (req.user.role !== 'employee' && req.body.emp_id) ? req.body.emp_id : req.user.id;
    const date  = new Date().toISOString().slice(0, 10);
    const time  = new Date().toTimeString().slice(0, 5);
    const att   = (await pool.query('SELECT * FROM attendance WHERE emp_id=$1 AND date=$2', [empId, date])).rows[0];
    if (!att?.check_in) return res.status(400).json({ error: 'Not checked in today' });
    if (att.check_out)  return res.status(400).json({ error: 'Already checked out' });
    const [ih,im] = att.check_in.split(':').map(Number);
    const [oh,om] = time.split(':').map(Number);
    const hours  = ((oh*60+om)-(ih*60+im))/60;
    const status = hours >= 4 ? 'present' : 'half_day';
    await pool.query('UPDATE attendance SET check_out=$1, hours=$2, status=$3 WHERE id=$4', [time, hours, status, att.id]);
    await pool.query('UPDATE employees SET status=$1 WHERE id=$2', [status, empId]);
    res.json({ id: att.id, check_out: time, hours, status });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  LEAVE TYPES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/leave-types', auth, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM leave_types ORDER BY name');
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  LEAVES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/leaves', auth, async (req, res) => {
  try {
    let sql = `SELECT l.*, e.name as emp_name, e.job as emp_job, e.color as emp_color,
               lt.name as type_name, lt.color as type_color
               FROM leaves l
               JOIN employees e  ON l.emp_id = e.id
               JOIN leave_types lt ON l.leave_type = lt.code
               WHERE 1=1`;
    const params = [];
    if (req.user.role === 'employee') { sql += ` AND l.emp_id=$${params.length+1}`; params.push(req.user.id); }
    if (req.query.status) { sql += ` AND l.status=$${params.length+1}`; params.push(req.query.status); }
    sql += ' ORDER BY l.created_at DESC';
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leaves', auth, async (req, res) => {
  try {
    const { leave_type, date_from, date_to, reason } = req.body;
    if (!leave_type || !date_from || !date_to) return res.status(400).json({ error: 'Leave type and dates required' });
    if (date_to < date_from) return res.status(400).json({ error: 'End date must be after start date' });
    const days = Math.ceil((new Date(date_to)-new Date(date_from))/86400000)+1;
    const emp  = (await pool.query('SELECT name FROM employees WHERE id=$1',[req.user.id])).rows[0];
    const r    = await pool.query(
      'INSERT INTO leaves (emp_id,leave_type,date_from,date_to,days,reason,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [req.user.id, leave_type, date_from, date_to, days, reason||'', 'pending']
    );
    await logActivity('Leave Requested', `${emp.name} applied for ${leave_type} (${days} day${days>1?'s':''})`, '📋', 'leave', req.user.id);
    res.status(201).json({ id: r.rows[0].id, days, status: 'pending' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leaves/:id/approve', auth, hrOnly, async (req, res) => {
  try {
    const lv = (await pool.query('SELECT l.*,e.name FROM leaves l JOIN employees e ON l.emp_id=e.id WHERE l.id=$1',[req.params.id])).rows[0];
    if (!lv) return res.status(404).json({ error: 'Not found' });
    await pool.query('UPDATE leaves SET status=$1,approved_by=$2,approved_at=$3 WHERE id=$4',['approved',req.user.id,new Date().toISOString(),req.params.id]);
    await logActivity('Leave Approved', `${lv.name}'s ${lv.leave_type} leave approved`, '✅', 'leave');
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/leaves/:id/reject', auth, hrOnly, async (req, res) => {
  try {
    const lv = (await pool.query('SELECT l.*,e.name FROM leaves l JOIN employees e ON l.emp_id=e.id WHERE l.id=$1',[req.params.id])).rows[0];
    if (!lv) return res.status(404).json({ error: 'Not found' });
    await pool.query('UPDATE leaves SET status=$1,rejection_reason=$2 WHERE id=$3',['rejected',req.body.reason||'',req.params.id]);
    await logActivity('Leave Rejected', `${lv.name}'s ${lv.leave_type} leave rejected`, '❌', 'leave');
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PAYROLL
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/payroll', auth, async (req, res) => {
  try {
    let sql = 'SELECT p.*, e.name as emp_name FROM payroll p JOIN employees e ON p.emp_id=e.id WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') { sql += ` AND p.emp_id=$${params.length+1}`; params.push(req.user.id); }
    if (req.query.month) { sql += ` AND p.month=$${params.length+1}`; params.push(req.query.month); }
    sql += ' ORDER BY p.month DESC, e.name ASC';
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/payroll', auth, hrOnly, async (req, res) => {
  try {
    const { emp_id, month, basic, hra, transport, medical, other, tax, pf } = req.body;
    if (!emp_id || !month || !basic) return res.status(400).json({ error: 'Employee, month and basic salary required' });
    const r = await pool.query(
      'INSERT INTO payroll (emp_id,month,basic,hra,transport,medical,other,tax,pf,state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',
      [emp_id, month, basic, hra||0, transport||0, medical||0, other||0, tax||0, pf||0, 'draft']
    );
    const emp = (await pool.query('SELECT name FROM employees WHERE id=$1',[emp_id])).rows[0];
    await logActivity('Payroll Created', `${month} payroll for ${emp?.name}`, '💰', 'payroll');
    res.status(201).json({ id: r.rows[0].id, state: 'draft' });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/payroll/:id/confirm', auth, hrOnly, async (req, res) => {
  try {
    await pool.query('UPDATE payroll SET state=$1 WHERE id=$2', ['confirmed', req.params.id]);
    await logActivity('Payroll Confirmed', `Payroll #${req.params.id} confirmed`, '✅', 'payroll');
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/payroll/:id/markpaid', auth, hrOnly, async (req, res) => {
  try {
    await pool.query('UPDATE payroll SET state=$1, payment_date=$2 WHERE id=$3', ['paid', new Date().toISOString().slice(0,10), req.params.id]);
    await logActivity('Payroll Paid', `Payroll #${req.params.id} paid`, '💸', 'payroll');
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
//  STATS (Dashboard)
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/stats', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [empR, attR, pendR, actR] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM employees'),
      pool.query('SELECT status FROM attendance WHERE date=$1', [today]),
      pool.query("SELECT COUNT(*) FROM leaves WHERE status='pending'"),
      pool.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 8'),
    ]);
    const todayAtt = attR.rows;
    res.json({
      totalEmp:     parseInt(empR.rows[0].count),
      present:      todayAtt.filter(a => a.status === 'present').length,
      halfday:      todayAtt.filter(a => a.status === 'half_day').length,
      absent:       todayAtt.filter(a => a.status === 'absent').length,
      onLeave:      todayAtt.filter(a => a.status === 'on_leave').length,
      lateArrivals: todayAtt.filter(a => a.status === 'half_day').length,
      pendingLeaves:parseInt(pendR.rows[0].count),
      activity:     actR.rows,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  HRMS API  →  http://localhost:${PORT}   ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
});
