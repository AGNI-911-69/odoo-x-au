# Setup & Run Guide

Complete instructions for getting the HRMS system running locally.

---

## Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| Node.js | v18+ | `node --version` |
| npm | v9+ | `npm --version` |
| Python | v3.10+ (Odoo module only) | `python --version` |

---

## Project Structure

```
odoo-x-au/
├── backend/          # Node.js + Express REST API
│   ├── server.js     # API routes and middleware
│   ├── db.js         # SQLite schema and connection
│   ├── seed.js       # First-time admin account setup
│   └── package.json
├── frontend/         # Vanilla HTML/CSS/JS single-page app
│   ├── index.html    # Login / Register
│   ├── dashboard.html
│   ├── employees.html
│   ├── attendance.html
│   ├── leave.html
│   ├── payroll.html
│   ├── api.js        # Shared API client and UI helpers
│   └── style.css
└── hrms_module/      # Odoo 17 addon (optional, for native Odoo install)
```

---

## Option A — Standalone Web App (Recommended for hackathon demo)

This runs the Node.js backend and serves the frontend directly. No Odoo installation needed.

### Step 1 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 2 — Create the first admin account

Run the interactive setup wizard. This creates the SQLite database and your first admin user.

```bash
node seed.js
```

You will be prompted for:
- Admin full name
- Admin email address
- Password (minimum 6 characters)

Example output:
```
Admin Full Name: Alice Admin
Admin Email: alice@company.com
Password (min 6 chars): ••••••

✓ Admin account created successfully!
  Email: alice@company.com
  Employee ID: EMP-1000

✓ 4 leave types created
✓ Setup complete. You can now start the server with: npm start
```

> **Skip this step** if `hrms.db` already exists — the database is already initialised.

### Step 3 — Start the API server

```bash
npm start
```

The server starts at `http://localhost:3000`. You should see:

```
╔═══════════════════════════════════════╗
║  HRMS API  →  http://localhost:3000   ║
╚═══════════════════════════════════════╝
```

### Step 4 — Open the frontend

Open `frontend/index.html` in your browser. You can do this by:

- **Double-clicking** the file in your file manager, or
- Using a local server for cleaner module imports:

```bash
# From the project root (requires Python)
python -m http.server 8080 --directory frontend
# Then open http://localhost:8080
```

### Step 5 — Sign in

Use the admin credentials you created in Step 2, or register a new account from the login page.

---

## Option B — Windows Quick Launch

A `start.bat` file is included at the project root for one-click startup on Windows.

```
Double-click start.bat
```

This opens two terminal windows — one for the backend server and one serving the frontend.

---

## Option C — Odoo 17 Native Module

Use this if you have an existing Odoo 17 instance.

### Step 1 — Copy the module

```bash
cp -r hrms_module /path/to/your/odoo/addons/
```

### Step 2 — Restart Odoo and update the module list

```bash
./odoo-bin -c odoo.conf -u all
```

### Step 3 — Install the module

In Odoo: **Apps → Search "Enterprise HRMS" → Install**

### Dependencies

The module depends on: `base`, `mail`, `web` — all included in Odoo 17 Community.

---

## Default Leave Types

These are seeded automatically on first run:

| Code | Name | Max Days |
|------|------|----------|
| ANNUAL | Paid Annual Leave | 18 |
| SICK | Sick Leave | 7 |
| CASUAL | Casual Leave | 5 |
| UNPAID | Unpaid Leave | 3 |

---

## User Roles

| Role | Access Level |
|------|-------------|
| `admin` | Full access — all modules + delete employees |
| `hr` | HR access — manage employees, approve leaves, run payroll |
| `employee` | Self-service — own attendance, own leave requests, own payroll view |

---

## Running the API Test Suite

With the server running on port 3000:

```bash
cd backend
node test_api.js
```

Runs 35 end-to-end tests covering auth, employees, attendance, leaves, and payroll.

---

## Resetting the Database

To start fresh, delete the SQLite file and re-run seed:

```bash
cd backend
rm hrms.db
node seed.js
```

---

## Environment Notes

- The JWT secret is defined in `server.js` as `hrms-jwt-secret-2026`. For production use, move this to an environment variable.
- The SQLite database file `hrms.db` is excluded from version control via `.gitignore`.
- CORS is open (`*`) for local development. Restrict this before any public deployment.
