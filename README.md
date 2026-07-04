# Odoo HRMS — AU Hackathon 2026

> **Every workday, perfectly aligned.**

A full-stack Human Resource Management System built for the Odoo × AU Hackathon 2026.

---

## 🚀 Live Demo

| | URL |
|---|---|
| **Frontend (Vercel)** | **[https://odoo-x-au.vercel.app](https://odoo-x-au.vercel.app)** |
| **Backend API (Railway)** | [https://odoo-x-au-production.up.railway.app](https://odoo-x-au-production.up.railway.app) |

> Register a new account on first visit — no demo data, all data is real.

---

## Features

| Module | Description |
|---|---|
| **Authentication** | Register / Login with JWT, role-based access |
| **Employee Profiles** | Kanban cards, search/filter, add/view with HR controls |
| **Attendance** | Check-in/out, daily/weekly view, work hours, CSV export |
| **Leave & Time-Off** | Calendar picker, leave balance, HR approval workflow |
| **Payroll** | Salary breakdown, draft → confirmed → paid lifecycle |
| **Dashboard** | Live KPIs, pending approvals, activity log |

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access, delete employees, manage everything |
| **HR Officer** | Manage employees, approve leaves, manage payroll |
| **Employee** | Own profile, own attendance, apply leave, view own payroll |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5 + ES Modules + CSS3 (Inter font) |
| API | Node.js 24 + Express 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT + bcrypt |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/AGNI-911-69/odoo-x-au.git
cd odoo-x-au

# 2. Start backend
cd backend
npm install
node server.js        # http://localhost:3000

# 3. Start frontend (new terminal)
cd ../frontend
python -m http.server 8080   # http://localhost:8080
```

Or just double-click **`start.bat`** in the root folder.

---

## Project Structure

```
odoo-x-au/
├── start.bat                   ← one-click local launcher
│
├── backend/
│   ├── server.js               ← REST API (Express + JWT)
│   ├── db.js                   ← SQLite schema + auto-sequence
│   ├── seed.js                 ← first-admin setup wizard
│   ├── test_api.js             ← 35-test API test suite
│   └── package.json
│
├── frontend/
│   ├── config.js               ← API URL config (change for local dev)
│   ├── api.js                  ← central API client, SVG icons, helpers
│   ├── style.css               ← full design system (purple/teal)
│   ├── index.html              ← login + register
│   ├── dashboard.html          ← HR dashboard with live KPIs
│   ├── employees.html          ← employee kanban + add/view modals
│   ├── attendance.html         ← check-in/out + bar chart insights
│   ├── leave.html              ← calendar + approval workflow
│   └── payroll.html            ← salary records + confirm/paid
│
└── hrms_module/                ← Odoo 17 Python custom module
    ├── models/                 ← ORM models (Employee, Attendance, Leave, Payroll)
    ├── views/                  ← XML views (kanban, list, form, calendar)
    └── security/               ← access rights + record rules
```

---

## API Reference

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |
| GET / POST | `/api/employees` | Auth |
| GET / PUT | `/api/employees/:id` | Auth |
| GET | `/api/attendance` | Auth |
| POST | `/api/attendance/checkin` | Auth |
| POST | `/api/attendance/checkout` | Auth |
| GET | `/api/leave-types` | Auth |
| GET / POST | `/api/leaves` | Auth |
| POST | `/api/leaves/:id/approve` | HR only |
| POST | `/api/leaves/:id/reject` | HR only |
| GET / POST | `/api/payroll` | Auth |
| POST | `/api/payroll/:id/confirm` | HR only |
| POST | `/api/payroll/:id/markpaid` | HR only |
| GET | `/api/stats` | Auth |

---

## Running Tests

```bash
cd backend
node test_api.js   # requires server running — 35/35 tests
```

---

*Built for the Odoo × AU Hackathon 2026*
