# Enterprise HRMS — Odoo Hackathon 2026

> **Every workday, perfectly aligned.**

A full-stack Human Resource Management System with a real SQLite database, REST API, and role-based frontend.

---

## Quick Start

**Double-click `start.bat`** — it starts both servers and opens the browser.

Or manually:

```bash
# Terminal 1: API server
cd D:\ODOO\backend
npm install        # first time only
node server.js     # runs on http://localhost:3000

# Terminal 2: Frontend
cd D:\ODOO\frontend
python -m http.server 8080   # runs on http://localhost:8080
```

Then open **http://localhost:8080**

---

## First-Time Setup

On first run, register your Admin account at the login page → "Register here".

No demo data. All data is created by real users.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5 + ES Modules + CSS3 |
| API | Node.js 24 + Express 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcrypt |

---

## Architecture

```
D:\ODOO\
├── start.bat               ← double-click to start everything
│
├── backend/
│   ├── server.js           ← REST API (Express)
│   ├── db.js               ← SQLite schema + connection
│   ├── seed.js             ← first-time admin setup wizard
│   └── package.json
│
├── frontend/
│   ├── api.js              ← central API client (no hardcoded data)
│   ├── index.html          ← login + register
│   ├── dashboard.html      ← HR dashboard (live KPIs)
│   ├── employees.html      ← employee kanban + add/view
│   ├── attendance.html     ← check-in/out + weekly chart
│   ├── leave.html          ← calendar picker + approvals
│   ├── payroll.html        ← salary records + workflow
│   └── style.css
│
└── hrms_module/            ← Odoo 17 custom module
    ├── models/             ← Python ORM models
    ├── views/              ← XML views
    ├── security/           ← access rights + record rules
    └── ...
```

---

## API Endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET  | `/api/auth/me` | Authenticated |
| GET/POST | `/api/employees` | Auth (HR=all, Emp=own) |
| GET/POST | `/api/attendance` | Auth |
| POST | `/api/attendance/checkin` | Auth |
| POST | `/api/attendance/checkout` | Auth |
| GET/POST | `/api/leaves` | Auth |
| POST | `/api/leaves/:id/approve` | HR only |
| POST | `/api/leaves/:id/reject` | HR only |
| GET/POST | `/api/payroll` | Auth (HR=all, Emp=own) |
| POST | `/api/payroll/:id/confirm` | HR only |
| POST | `/api/payroll/:id/markpaid` | HR only |
| GET  | `/api/stats` | Auth |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access, can delete employees |
| **HR Officer** | Manage employees, approve leaves, manage payroll |
| **Employee** | View own profile, own attendance, apply leave, view own payroll |
