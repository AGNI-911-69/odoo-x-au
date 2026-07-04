# Contributing to Odoo x AU — Enterprise HRMS

Thank you for being part of this project! This guide covers how to work together cleanly during the hackathon and beyond.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Branch Naming](#branch-naming)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Team Roles](#team-roles)

---

## Project Structure

```
odoo-x-au/
├── backend/          # Node.js + Express + SQLite REST API
├── frontend/         # Vanilla JS / HTML / CSS web app
├── hrms_module/      # Odoo 17 native Python module
├── API_DOCS.md       # Full REST API reference
├── FEATURES.md       # Feature breakdown and role access matrix
├── SETUP.md          # Developer setup and run guide
└── README.md         # Project overview
```

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/AGNI-911-69/odoo-x-au.git
   cd odoo-x-au
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Seed the database and create the first admin:
   ```bash
   node seed.js
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```

5. Serve the frontend (ES modules require a real server, not `file://`):
   ```bash
   cd ../frontend
   python3 -m http.server 3001
   ```

See [SETUP.md](./SETUP.md) for full instructions including Odoo 17 module installation.

---

## Branch Naming

Use short, descriptive branch names prefixed by type:

| Type | Example |
|------|---------|
| New feature | `feat/payroll-export` |
| Bug fix | `fix/checkin-duplicate-block` |
| Documentation | `docs/api-auth-section` |
| Chores / config | `chore/update-gitignore` |
| Refactoring | `refactor/api-client-cleanup` |

Always branch off `main` and open a PR to merge back.

---

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
<type>(<scope>): <short summary>

<optional body — what and why, not how>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(leave): add overlap validation on leave apply
fix(attendance): prevent duplicate check-in on same day
docs(api): document payroll confirm endpoint
chore: add MIT license
```

Keep the subject line under 72 characters.

---

## Pull Request Process

1. Make sure your branch is up to date with `main` before opening a PR.
2. Fill in the PR template — summary, what was tested, any blockers.
3. At least one team member should review before merging.
4. Squash or merge — no force-pushes to `main`.

---

## Code Style

**Backend (Node.js)**
- Use `const` / `let`, no `var`
- Async/await over raw callbacks
- All DB queries parameterised (no string interpolation with user input)
- Keep route handlers thin — logic in helper functions

**Frontend (Vanilla JS)**
- All data from the real API via `api.js` — no hardcoded values, no localStorage data
- SVG icons only — no emoji in UI
- Toast system for all user feedback (success / error / info)

**Odoo Module (Python)**
- Follow Odoo ORM conventions — `_name`, `_description`, `_inherit` on every model
- Use `@api.constrains` for business rule validation
- Keep wizard logic in `wizards/`, views in `views/`

---

## Team Roles

| Member | Area |
|--------|------|
| Team Lead | Architecture, backend API, deployment |
| Frontend Dev | UI/UX, HTML/CSS/JS pages |
| Odoo Dev | Python module, views, security |
| QA / Docs | Test suite, API docs, README |

---

For questions, open an issue or ping the team lead directly.
