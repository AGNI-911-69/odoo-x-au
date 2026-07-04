# Enterprise HRMS — Odoo 17 Custom Module

> **Every workday, perfectly aligned.**

A production-ready Human Resource Management System built as a custom Odoo 17 module for the AU Hackathon.

## Features

| Module | Description |
|---|---|
| **Authentication & Roles** | Admin/HR Officer vs Employee, record-level security rules |
| **Employee Profiles** | Kanban + list + form views, profile image, documents tab |
| **Attendance Management** | Check-in/check-out, daily/weekly views, auto work-hours calculation |
| **Leave & Time-Off** | Calendar picker, approval workflow, leave balance tracking |
| **Payroll** | Salary components, deductions, net pay, draft → confirmed → paid workflow |
| **Dashboard** | Live KPIs, pending leave approvals, recent activity |

## Installation

1. Copy `hrms_module/` into your Odoo `addons` folder.
2. Restart Odoo server.
3. Go to **Apps** → search `Enterprise HRMS` → **Install**.
4. Assign users to the HRMS groups:
   - `Enterprise HRMS / Employee`
   - `Enterprise HRMS / HR Officer`
   - `Enterprise HRMS / Administrator`

## Module Structure

```
hrms_module/
├── __manifest__.py
├── __init__.py
├── models/
│   ├── hrms_employee.py       # Employee profiles + documents
│   ├── hrms_attendance.py     # Attendance + check-in/out logic
│   ├── hrms_leave.py          # Leave types, balances, requests
│   └── hrms_payroll.py        # Payroll records + workflow
├── wizards/
│   └── hrms_leave_wizard.py   # Approve/reject wizard
├── views/
│   ├── hrms_employee_views.xml
│   ├── hrms_attendance_views.xml
│   ├── hrms_leave_views.xml
│   ├── hrms_payroll_views.xml
│   ├── hrms_dashboard_views.xml
│   └── hrms_menus.xml
├── security/
│   ├── hrms_security.xml      # Groups + record rules
│   └── ir.model.access.csv    # Model access rights
├── data/
│   └── hrms_sequence.xml      # Employee ID sequence + leave types
├── demo/
│   └── hrms_demo.xml          # Sample employees, attendance, leaves, payroll
└── static/
    └── src/css/hrms_style.css # Custom purple/teal UI theme
```

## Tech Stack

- Odoo 17 (Community / Enterprise)
- Python 3.10+
- PostgreSQL (via Odoo ORM — no raw SQL)
- XML views, QWeb kanban templates
- Custom CSS (no external dependencies)

## Team

Built for the Odoo × AU Hackathon 2026.
