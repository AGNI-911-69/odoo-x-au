# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- MIT License
- CONTRIBUTING guide with branch naming, commit conventions, and code style rules
- CHANGELOG to track all project milestones

---

## [1.4.0] — 2026-07-04

### Added — Production Deployment Setup (Vercel + Railway)
- `PORT` sourced from `process.env.PORT` for Railway compatibility
- `JWT_SECRET` sourced from environment variable
- `engines.node >= 18` declared in `package.json`
- `Procfile` added for Railway process management
- `config.js` in frontend — single file to set `HRMS_API_URL` after backend deploy
- All HTML pages load `config.js` before `api.js` so the API base URL is configurable without touching any other file

---

## [1.3.0] — 2026-07-04

### Added — Documentation Suite
- `FEATURES.md`: comprehensive feature breakdown with RBAC matrix (20 permissions across Employee / HR / Admin roles)
- `SETUP.md`: step-by-step setup for all three deployment paths (Node.js standalone, Windows `start.bat`, Odoo 17 native)
- `API_DOCS.md`: full REST API reference — 20+ endpoints with request/response shapes, role guards, query params, and HTTP error codes

---

## [1.2.0] — 2026-07-04

### Added — Company Branding
- Replaced "Enterprise HRMS" header text with the company logo image

### Fixed — UI Polish Round 2
- Sidebar: Settings + Support nav links; dark-purple Check In/Out button matching design spec
- Attendance table: footer showing "Showing X of Y entries" with page number buttons
- Employees: "View Profile" link added to kanban card footer
- CSS: custom scrollbar, focus ring, approval card left accent, staggered card animations, number count-up animation, KPI card shimmer on hover
- Calendar: removed giant `aspect-ratio: 1/1` circle; fixed day cells to 32×32 px
- Search icon: explicit 15 px width/height to stop browser emoji fallback
- Leave layout: calendar and form side-by-side in a 2-column grid within one card
- `cal-day.selected`: solid purple background instead of outline
- In-range days: full width, no margin hack

---

## [1.1.0] — 2026-07-04

### Added — Full UI Redesign
- Inter font via Google Fonts
- CSS custom properties: purple/teal/success/danger/warning palette
- Sidebar: brand, nav with SVG icons, active teal border, check-in/out button
- Topbar: pill search, icon buttons, user avatar
- KPI cards: coloured icon-wrap squares, hover lift animation
- Employee kanban cards: photo circle, status dot, footer metadata
- Status badges: all states with semantic colours
- Tables: clean borders, hover highlight
- Modals: scale+fade animation, backdrop blur
- Calendar: today highlight, selected/range states
- Leave balance cards: icon + days + label layout
- Approval cards: avatar + reason + date + action buttons
- Skeleton loader shimmer animation
- Toast notifications: slide-up with success/danger/info variants
- Full SVG icon library in `api.js` (22 icons, zero emoji)
- `renderSidebar()` and `renderTopbar()` helpers
- `badge()`, `avatar()`, `statusDot()`, `formatHours()`, `timeAgo()` utility helpers

---

## [1.0.0] — 2026-07-04

### Added — Real Backend + Full API
- `db.js`: clean SQLite schema, auto `EMP-XXXX` sequence, 4 default leave types seeded on first run
- `server.js`: full REST API — JWT auth, bcrypt, role-based access control
  - `POST /api/auth/register` and `POST /api/auth/login`
  - `GET/POST/PUT /api/employees` — HR sees all, employee sees own only
  - `POST /api/attendance/checkin|checkout` — real-time recording
  - `GET/POST /api/leaves` + approve/reject workflow
  - `GET/POST /api/payroll` + confirm / mark-paid lifecycle
  - `GET /api/stats` — live KPIs from real DB queries
- `seed.js`: interactive first-admin wizard (no fake data)
- `start.bat`: one-click Windows launcher for both backend and frontend servers
- Frontend zero-hardcoded-data rewrite: all six pages consume real API via `api.js`

### Added — Test Suite (35/35 passing)
- Auth: register, login, bad-password rejection, `/me`
- Employees: role-guard checks, CRUD
- Attendance: check-in, duplicate block, check-out, date filter
- Leaves: apply, overlap/date validation, HR approve, role guards
- Payroll: add, duplicate block, confirm, mark-paid, role guards
- Stats: live KPI assertions against real DB

---

## [0.1.0] — 2026-07-04

### Added — Odoo 17 Module Scaffold + Frontend Prototype
- `hrms_module` Odoo 17 package with full manifest, models, views, security, demo data, and custom CSS
- Employee, Attendance, Leave, Payroll models with ORM constraints and workflows
- Leave approval wizard (`TransientModel`)
- Security groups (Employee / HR Officer / Admin) with record rules and `ir.model.access.csv`
- All view types: kanban, list, form, calendar, search per model
- Menu structure: Dashboard, Employees, Attendance, Leave, Payroll, Config
- Standalone frontend prototype with six HTML pages and `app.js` (localStorage, later replaced by real API)

---

[Unreleased]: https://github.com/AGNI-911-69/odoo-x-au/compare/HEAD...HEAD
[1.4.0]: https://github.com/AGNI-911-69/odoo-x-au/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/AGNI-911-69/odoo-x-au/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/AGNI-911-69/odoo-x-au/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/AGNI-911-69/odoo-x-au/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AGNI-911-69/odoo-x-au/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/AGNI-911-69/odoo-x-au/releases/tag/v0.1.0
