# Feature Overview

Complete breakdown of everything implemented in the Enterprise HRMS system.

---

## Architecture

The system ships as two independent but complementary deliverables:

| Layer | Stack |
|-------|-------|
| **Standalone Web App** | Node.js + Express + SQLite backend, Vanilla JS frontend |
| **Odoo 17 Module** | Native Python addon (`hrms_module`) installable on any Odoo 17 instance |

Both share the same domain model: Employees, Attendance, Leaves, Payroll.

---

## Role-Based Access Control

Three roles are enforced at both the API layer (JWT middleware) and the UI layer (conditional rendering).

| Feature | Employee | HR Officer | Admin |
|---------|----------|-----------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Edit own phone number | ✅ | ✅ | ✅ |
| View all employees | ❌ | ✅ | ✅ |
| Add / edit employees | ❌ | ✅ | ✅ |
| Delete employees | ❌ | ❌ | ✅ |
| Check in / out (own) | ✅ | ✅ | ✅ |
| Check in / out (any employee) | ❌ | ✅ | ✅ |
| View own attendance | ✅ | ✅ | ✅ |
| View all attendance | ❌ | ✅ | ✅ |
| Apply for leave | ✅ | ✅ | ✅ |
| View own leave history | ✅ | ✅ | ✅ |
| View all leave requests | ❌ | ✅ | ✅ |
| Approve / reject leaves | ❌ | ✅ | ✅ |
| View own payroll | ✅ | ✅ | ✅ |
| View all payroll | ❌ | ✅ | ✅ |
| Create payroll records | ❌ | ✅ | ✅ |
| Confirm / mark payroll paid | ❌ | ✅ | ✅ |
| Dashboard KPIs | ❌ | ✅ | ✅ |
| Activity log | ❌ | ✅ | ✅ |

---

## Module 1 — Authentication

- JWT-based stateless authentication (24-hour token expiry)
- bcrypt password hashing (10 salt rounds)
- Self-registration with role selection
- Interactive first-admin setup wizard (`seed.js`)
- Token stored in `sessionStorage` — clears on tab close
- Auto-redirect to login on 401 response
- Role-aware post-login routing: HR → Dashboard, Employee → Employees page
- Change own password endpoint with current-password verification

---

## Module 2 — Employee Management

- Auto-generated Employee ID sequence: `EMP-1001`, `EMP-1002`, …
- Employee kanban card view with avatar initials, colour coding, and live status dot
- Fields: name, email, phone, job title, department, role, employment date, basic salary
- Search by name, department, or job title
- Filter by department (dynamic, built from real data)
- Filter by attendance status (present / absent / on leave / half-day)
- Add Employee modal (HR/Admin)
- View Profile modal — shows salary only to HR/Admin
- Employee document sub-model (Odoo module): ID, passport, contract, certificate
- Smart button counts for attendance and leave records (Odoo module)
- Unique constraints on employee code and email

---

## Module 3 — Attendance Tracking

- One record per employee per day (enforced by unique DB constraint)
- Check-in records current server time automatically
- Check-out calculates total work hours
- Auto-status: `present` if ≥ 4 hours worked, `half_day` if < 4 hours
- Employee status field updated live on check-in/check-out
- Daily view: filter by date picker
- Weekly view: bar chart of daily present counts (built from real API data)
- Department filter for HR table view
- CSV export of attendance records for any selected date
- KPI cards: Present Today, Absent, On Leave, Late Arrivals
- Attendance Insights panel with week-over-week punctuality percentage

---

## Module 4 — Leave & Time-Off

**Leave Types (seeded by default):**

| Code | Name | Entitlement |
|------|------|------------|
| ANNUAL | Paid Annual Leave | 18 days/year |
| SICK | Sick Leave | 7 days/year |
| CASUAL | Casual Leave | 5 days/year |
| UNPAID | Unpaid Leave | 3 days |

**Employee features:**
- Interactive calendar date-range picker (click to select from/to dates)
- Leave balance cards showing remaining days per type (calculated from approved leaves)
- Apply for leave via inline form or modal
- Own leave history table with status badges

**HR/Admin features:**
- Pending approvals panel with employee avatar, reason, and date range
- One-click approve / reject with reason
- All leave requests table with status filter
- Approval/rejection recorded with approver ID and timestamp
- Activity log entry created on every state change

---

## Module 5 — Payroll

**Salary components tracked per record:**

| Component | Type |
|-----------|------|
| Basic Salary | Earning |
| House Rent Allowance (HRA) | Earning |
| Transport Allowance | Earning |
| Medical Allowance | Earning |
| Other Allowances | Earning |
| Tax Deduction | Deduction |
| Provident Fund (PF) | Deduction |

**Computed fields (auto-calculated, not stored as user input):**
- Gross Salary = Basic + all allowances
- Total Deductions = Tax + PF
- Net Salary = Gross − Total Deductions

**Workflow states:** `draft` → `confirmed` → `paid`

- Unique constraint: one record per employee per month
- Payment date stamped automatically when marked paid
- Summary KPI row: Total Gross, Total Deductions, Net Pay across filtered records
- Month and status filters on the payroll table
- Employees see only their own records; salary figures hidden from self on employee page

---

## Module 6 — Dashboard

- Live KPI cards fetched from `/api/stats` on every load:
  - Total Employees
  - Present Today (present + half-day)
  - Pending Leave Requests
  - On Leave Today / Absent count
- Pending leave approvals table with inline approve/reject
- Recent Activity feed (last 8 events) with category icons and relative timestamps
- HR-only route — employees are redirected to the employees page

---

## Activity Log

Every significant action is recorded automatically:

| Event | Trigger |
|-------|---------|
| System Initialized | First registration / seed run |
| New Account Created | User self-registers |
| Login | Successful sign-in |
| New Employee Added | HR adds employee |
| Employee Updated | HR edits employee record |
| Leave Requested | Employee submits leave |
| Leave Approved | HR approves leave |
| Leave Rejected | HR rejects leave |
| Payroll Created | HR creates payroll record |
| Payroll Confirmed | HR confirms payroll |
| Payroll Paid | HR marks payroll as paid |

---

## Frontend UX Details

- Fully responsive layout with sidebar navigation
- Purple/teal design system with CSS custom properties
- SVG icon library (24 icons) — no external icon dependency
- Skeleton loader placeholders while data fetches
- Toast notifications (success / danger) with auto-dismiss after 3.5s
- Modal dialogs with backdrop blur and scale animation
- Status badges with semantic colours for all states
- Employee avatar initials with consistent colour assignment per employee
- Global search bar in topbar (wired to employee search on employees page)
- Role-aware sidebar: Dashboard link hidden from employees

---

## Odoo 17 Module — Additional Features

- Native Odoo security groups: `HRMS Employee`, `HRMS HR Officer`, `HRMS Admin`
- Record-level security rules per group
- Full `ir.model.access.csv` CRUD matrix
- Chatter (mail.thread) on Employee, Attendance, Leave, Payroll models
- Activity mixin for scheduled follow-ups
- Employee ID auto-sequence via `ir.sequence`
- Leave approval wizard (`TransientModel`) for bulk actions
- Demo data: 7 employees, attendance records, leave requests, payroll records
- Custom CSS injected into `web.assets_backend`
- Kanban, list, form, calendar, and search views for every model
- Module manifest targets Odoo 17.0, category: Human Resources

---

## Test Coverage

`backend/test_api.js` — 35 end-to-end tests:

| Area | Tests |
|------|-------|
| Auth | Register, login, bad password rejection, `/me` |
| Employees | HR sees all, employee sees own, add, get by ID, role guards |
| Attendance | Check-in, double check-in block, check-out, GET by date |
| Leaves | Get types, apply, date validation, HR approve, role guards |
| Payroll | Add, duplicate block, confirm, mark paid, role guards |
| Stats | Live KPIs from real DB |
