import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const db = new Database(join(__dirname, 'hrms.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS emp_sequence (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    next_val INTEGER DEFAULT 1001
  );
  INSERT OR IGNORE INTO emp_sequence (id, next_val) VALUES (1, 1001);

  CREATE TABLE IF NOT EXISTS employees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT UNIQUE NOT NULL,
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    phone      TEXT DEFAULT '',
    job        TEXT DEFAULT '',
    dept       TEXT DEFAULT '',
    role       TEXT DEFAULT 'employee',
    status     TEXT DEFAULT 'absent',
    joined     TEXT DEFAULT '',
    salary     REAL DEFAULT 0,
    color      TEXT DEFAULT '#5B2D8E',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leave_types (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    code     TEXT UNIQUE NOT NULL,
    name     TEXT NOT NULL,
    max_days INTEGER DEFAULT 0,
    color    TEXT DEFAULT '#5B2D8E'
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id     INTEGER NOT NULL,
    date       TEXT NOT NULL,
    check_in   TEXT,
    check_out  TEXT,
    status     TEXT DEFAULT 'absent',
    hours      REAL DEFAULT 0,
    FOREIGN KEY(emp_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(emp_id, date)
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id           INTEGER NOT NULL,
    leave_type       TEXT NOT NULL,
    date_from        TEXT NOT NULL,
    date_to          TEXT NOT NULL,
    days             REAL NOT NULL,
    reason           TEXT DEFAULT '',
    status           TEXT DEFAULT 'pending',
    approved_by      INTEGER,
    approved_at      TEXT,
    rejection_reason TEXT DEFAULT '',
    created_at       TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(emp_id) REFERENCES employees(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id       INTEGER NOT NULL,
    month        TEXT NOT NULL,
    basic        REAL DEFAULT 0,
    hra          REAL DEFAULT 0,
    transport    REAL DEFAULT 0,
    medical      REAL DEFAULT 0,
    other        REAL DEFAULT 0,
    tax          REAL DEFAULT 0,
    pf           REAL DEFAULT 0,
    state        TEXT DEFAULT 'draft',
    payment_date TEXT,
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(emp_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE(emp_id, month)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    text        TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon        TEXT DEFAULT '🔔',
    category    TEXT DEFAULT 'system',
    emp_id      INTEGER,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO leave_types (code, name, max_days, color) VALUES
    ('ANNUAL', 'Paid Annual Leave', 18, '#5B2D8E'),
    ('SICK',   'Sick Leave',         7, '#E74C3C'),
    ('UNPAID', 'Unpaid Leave',        3, '#95A5A6'),
    ('CASUAL', 'Casual Leave',        5, '#1ABC9C');
`);

export function nextEmpCode() {
  const row = db.prepare('SELECT next_val FROM emp_sequence WHERE id = 1').get();
  db.prepare('UPDATE emp_sequence SET next_val = next_val + 1 WHERE id = 1').run();
  return 'EMP-' + String(row.next_val).padStart(4, '0');
}

export default db;
