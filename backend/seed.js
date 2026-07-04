import db from './db.js';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// ── Create first admin user ───────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║  HRMS System Setup — Create Your First Admin Account        ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const name = await ask('Admin Full Name: ');
const email = await ask('Admin Email: ');
const password = await ask('Password (min 6 chars): ');

if (!name || !email || !password || password.length < 6) {
  console.log('❌ Invalid input. Setup cancelled.');
  process.exit(1);
}

const hashedPassword = bcrypt.hashSync(password, 10);
const code = 'EMP-1000';
const joined = new Date().toISOString().slice(0, 10);

const insertAdmin = db.prepare(`
  INSERT INTO employees (code, name, email, password, phone, job, dept, role, status, joined, salary, color)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  insertAdmin.run(code, name, email, hashedPassword, '', 'System Administrator', 'Management', 'admin', 'present', joined, 0, '#5B2D8E');
  console.log(`\n✓ Admin account created successfully!`);
  console.log(`  Email: ${email}`);
  console.log(`  Employee ID: ${code}\n`);
} catch (e) {
  console.log(`❌ Error: ${e.message}`);
  process.exit(1);
}

// ── Insert default leave types (only config data, not demo) ───────────────────
const leaveTypes = [
  { code:'ANNUAL', name:'Paid Annual Leave', max_days:18, color:'#5B2D8E' },
  { code:'SICK',   name:'Sick Leave',        max_days:7,  color:'#E74C3C' },
  { code:'UNPAID', name:'Unpaid Leave',      max_days:3,  color:'#95A5A6' },
  { code:'CASUAL', name:'Casual Leave',      max_days:5,  color:'#1ABC9C' },
];
const insertLT = db.prepare(`INSERT OR IGNORE INTO leave_types (code, name, max_days, color) VALUES (?, ?, ?, ?)`);
leaveTypes.forEach(lt => insertLT.run(lt.code, lt.name, lt.max_days, lt.color));
console.log(`✓ ${leaveTypes.length} leave types created`);

// ── Add initial system activity ───────────────────────────────────────────────
db.prepare(`INSERT INTO activity_log (text, description, icon, category) VALUES (?, ?, ?, ?)`).run('System Initialized', `HRMS setup by ${name}`, '🚀', 'system');

rl.close();
db.close();
console.log('\n✓ Setup complete. You can now start the server with: npm start\n');
