// ── PostgreSQL client (Railway provides DATABASE_URL automatically) ───────────
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// ── Schema init ───────────────────────────────────────────────────────────────
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emp_sequence (
      id   INTEGER PRIMARY KEY CHECK(id = 1),
      next_val INTEGER DEFAULT 1001
    );
    INSERT INTO emp_sequence (id, next_val) VALUES (1, 1001)
      ON CONFLICT DO NOTHING;

    CREATE TABLE IF NOT EXISTS employees (
      id         SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leave_types (
      id       SERIAL PRIMARY KEY,
      code     TEXT UNIQUE NOT NULL,
      name     TEXT NOT NULL,
      max_days INTEGER DEFAULT 0,
      color    TEXT DEFAULT '#5B2D8E'
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id         SERIAL PRIMARY KEY,
      emp_id     INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      date       TEXT NOT NULL,
      check_in   TEXT,
      check_out  TEXT,
      status     TEXT DEFAULT 'absent',
      hours      REAL DEFAULT 0,
      UNIQUE(emp_id, date)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id               SERIAL PRIMARY KEY,
      emp_id           INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type       TEXT NOT NULL,
      date_from        TEXT NOT NULL,
      date_to          TEXT NOT NULL,
      days             REAL NOT NULL,
      reason           TEXT DEFAULT '',
      status           TEXT DEFAULT 'pending',
      approved_by      INTEGER,
      approved_at      TIMESTAMPTZ,
      rejection_reason TEXT DEFAULT '',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id           SERIAL PRIMARY KEY,
      emp_id       INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
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
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(emp_id, month)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id          SERIAL PRIMARY KEY,
      text        TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon        TEXT DEFAULT '🔔',
      category    TEXT DEFAULT 'system',
      emp_id      INTEGER,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO leave_types (code, name, max_days, color) VALUES
      ('ANNUAL', 'Paid Annual Leave', 18, '#5B2D8E'),
      ('SICK',   'Sick Leave',         7, '#E74C3C'),
      ('UNPAID', 'Unpaid Leave',        3, '#95A5A6'),
      ('CASUAL', 'Casual Leave',        5, '#1ABC9C')
    ON CONFLICT DO NOTHING;
  `);
  console.log('✓ PostgreSQL schema ready');
}

initSchema().catch(err => {
  console.error('❌ Schema init failed:', err.message);
});

// ── nextEmpCode ───────────────────────────────────────────────────────────────
export async function nextEmpCode() {
  const res = await pool.query(
    `UPDATE emp_sequence SET next_val = next_val + 1 WHERE id = 1 RETURNING next_val`
  );
  return 'EMP-' + String(res.rows[0].next_val).padStart(4, '0');
}

export default pool;
