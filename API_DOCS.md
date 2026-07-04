# HRMS REST API Documentation

Base URL: `http://localhost:3000/api`

All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Authentication

### POST `/auth/register`
Register a new user account.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "password": "secret123",
  "role": "employee"
}
```
**Roles:** `employee` | `hr` | `admin`

**Response `201`:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "code": "EMP-1001", "name": "Jane Doe", "role": "employee" }
}
```

---

### POST `/auth/login`
Authenticate and receive a JWT token.

**Body:**
```json
{ "email": "jane@company.com", "password": "secret123" }
```

**Response `200`:**
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "code": "EMP-1001", "name": "Jane Doe", "role": "employee" }
}
```

---

### GET `/auth/me` 🔒
Get the currently authenticated user's profile.

**Response `200`:** Employee object (no password field).

---

### PUT `/auth/password` 🔒
Change own password.

**Body:**
```json
{ "current_password": "old", "new_password": "newpass123" }
```

---

## Employees

### GET `/employees` 🔒
- **HR/Admin:** Returns all employees ordered by name.
- **Employee:** Returns own record only.

**Response `200`:** Array of employee objects.

---

### GET `/employees/:id` 🔒
Get a single employee by ID.
- Employees can only access their own record.

---

### POST `/employees` 🔒 HR/Admin only
Add a new employee.

**Body:**
```json
{
  "name": "John Smith",
  "email": "john@company.com",
  "password": "pass123",
  "phone": "+1-555-0100",
  "job": "Software Engineer",
  "dept": "Engineering",
  "role": "employee",
  "salary": 75000,
  "joined": "2026-07-04"
}
```

---

### PUT `/employees/:id` 🔒
Update an employee record.
- **HR/Admin:** Can update `name`, `phone`, `job`, `dept`, `role`, `salary`, `status`, `joined`.
- **Employee:** Can only update own `phone`.

---

### DELETE `/employees/:id` 🔒 Admin only
Permanently delete an employee record.

---

## Attendance

### GET `/attendance` 🔒
Fetch attendance records.

**Query params:**
| Param | Description |
|-------|-------------|
| `date` | Filter by date (`YYYY-MM-DD`) |
| `emp_id` | Filter by employee (HR/Admin only) |

- Employees always see only their own records.

---

### POST `/attendance/checkin` 🔒
Record a check-in for today.

**Body (HR/Admin only, to check in on behalf):**
```json
{ "emp_id": 3 }
```
Employees use an empty body — their own ID is used automatically.

**Response `200`:**
```json
{ "id": 12, "check_in": "09:32" }
```

---

### POST `/attendance/checkout` 🔒
Record a check-out for today.

**Response `200`:**
```json
{ "id": 12, "check_out": "18:05", "hours": 8.55, "status": "present" }
```

Status is automatically set to `half_day` if total hours < 4.

---

## Leave Types

### GET `/leave-types` 🔒
Returns all configured leave types.

**Response `200`:**
```json
[
  { "id": 1, "code": "ANNUAL", "name": "Paid Annual Leave", "max_days": 18, "color": "#5B2D8E" },
  { "id": 2, "code": "SICK",   "name": "Sick Leave",        "max_days": 7,  "color": "#E74C3C" },
  { "id": 3, "code": "UNPAID", "name": "Unpaid Leave",      "max_days": 3,  "color": "#95A5A6" },
  { "id": 4, "code": "CASUAL", "name": "Casual Leave",      "max_days": 5,  "color": "#1ABC9C" }
]
```

---

## Leaves

### GET `/leaves` 🔒
Fetch leave requests.

**Query params:**
| Param | Description |
|-------|-------------|
| `status` | Filter by `pending` / `approved` / `rejected` |

- Employees see only their own requests.
- HR/Admin see all.

---

### POST `/leaves` 🔒
Submit a new leave request.

**Body:**
```json
{
  "leave_type": "ANNUAL",
  "date_from": "2026-07-10",
  "date_to": "2026-07-14",
  "reason": "Family vacation"
}
```

**Response `201`:**
```json
{ "id": 5, "days": 5, "status": "pending" }
```

---

### POST `/leaves/:id/approve` 🔒 HR/Admin only
Approve a pending leave request.

---

### POST `/leaves/:id/reject` 🔒 HR/Admin only
Reject a leave request.

**Body (optional):**
```json
{ "reason": "Staffing constraints" }
```

---

## Payroll

### GET `/payroll` 🔒
Fetch payroll records.

**Query params:**
| Param | Description |
|-------|-------------|
| `month` | Filter by month string (e.g. `July 2026`) |

- Employees see only their own records.

---

### POST `/payroll` 🔒 HR/Admin only
Create a new payroll record.

**Body:**
```json
{
  "emp_id": 2,
  "month": "July 2026",
  "basic": 75000,
  "hra": 15000,
  "transport": 3000,
  "medical": 2000,
  "other": 0,
  "tax": 8000,
  "pf": 5000
}
```

**Note:** One record per employee per month (unique constraint enforced).

---

### POST `/payroll/:id/confirm` 🔒 HR/Admin only
Move a payroll record from `draft` → `confirmed`.

---

### POST `/payroll/:id/markpaid` 🔒 HR/Admin only
Move a payroll record from `confirmed` → `paid`. Sets `payment_date` to today.

---

## Dashboard Stats

### GET `/stats` 🔒
Returns live KPIs for the dashboard.

**Response `200`:**
```json
{
  "totalEmp": 12,
  "present": 8,
  "halfday": 1,
  "absent": 2,
  "onLeave": 1,
  "lateArrivals": 1,
  "pendingLeaves": 3,
  "activity": [
    {
      "id": 42,
      "text": "Leave Approved",
      "description": "Jane Doe's ANNUAL leave approved",
      "icon": "✅",
      "category": "leave",
      "created_at": "2026-07-04T10:23:00"
    }
  ]
}
```

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid JWT token |
| `403` | Insufficient role permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, already checked in, etc.) |
| `500` | Internal server error |
