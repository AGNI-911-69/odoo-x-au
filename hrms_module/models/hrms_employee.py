# -*- coding: utf-8 -*-
import re
from odoo import models, fields, api
from odoo.exceptions import ValidationError


class HrmsEmployee(models.Model):
    _name = 'hrms.employee'
    _description = 'HRMS Employee'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'name'
    _order = 'name asc'

    # ── Identity ──────────────────────────────────────────────────────────────
    name = fields.Char(string='Full Name', required=True, tracking=True)
    employee_code = fields.Char(
        string='Employee ID', required=True, copy=False,
        tracking=True, index=True, default='New'
    )
    profile_image = fields.Image(
        string='Profile Picture', max_width=256, max_height=256
    )

    # ── Personal Details ──────────────────────────────────────────────────────
    email = fields.Char(string='Email', required=True, tracking=True)
    phone = fields.Char(string='Phone', tracking=True)
    address = fields.Text(string='Address', tracking=True)
    date_of_birth = fields.Date(string='Date of Birth')
    gender = fields.Selection([
        ('male', 'Male'), ('female', 'Female'), ('other', 'Other'),
    ], string='Gender')

    # ── Job Details ───────────────────────────────────────────────────────────
    job_title = fields.Char(string='Job Title', tracking=True)
    department = fields.Char(string='Department', tracking=True)
    date_joined = fields.Date(
        string='Date Joined', default=fields.Date.today, tracking=True
    )
    employment_type = fields.Selection([
        ('full_time', 'Full Time'), ('part_time', 'Part Time'),
        ('contract', 'Contract'), ('intern', 'Intern'),
    ], string='Employment Type', default='full_time', tracking=True)

    # ── Role / Status ─────────────────────────────────────────────────────────
    role = fields.Selection([
        ('employee', 'Employee'),
        ('hr', 'HR Officer'),
        ('admin', 'Admin'),
    ], string='Role', default='employee', required=True, tracking=True)

    status = fields.Selection([
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('on_leave', 'On Leave'),
        ('half_day', 'Half-Day'),
    ], string='Today\'s Status', default='absent', tracking=True)

    active = fields.Boolean(default=True)

    # ── Linked Odoo User ──────────────────────────────────────────────────────
    user_id = fields.Many2one(
        'res.users', string='Related User', ondelete='set null', tracking=True
    )

    # ── Salary (basic, stored on employee for payroll reference) ──────────────
    basic_salary = fields.Float(string='Basic Salary', digits=(16, 2), tracking=True)

    # ── Related Records ───────────────────────────────────────────────────────
    attendance_ids = fields.One2many('hrms.attendance', 'employee_id', string='Attendance')
    leave_ids = fields.One2many('hrms.leave', 'employee_id', string='Leave Requests')
    payroll_ids = fields.One2many('hrms.payroll', 'employee_id', string='Payroll Records')
    document_ids = fields.One2many('hrms.employee.document', 'employee_id', string='Documents')

    # ── Computed Counts ───────────────────────────────────────────────────────
    attendance_count = fields.Integer(compute='_compute_counts', string='Attendance')
    leave_count = fields.Integer(compute='_compute_counts', string='Leaves')
    pending_leave_count = fields.Integer(compute='_compute_counts', string='Pending Leaves')

    @api.depends('attendance_ids', 'leave_ids')
    def _compute_counts(self):
        for rec in self:
            rec.attendance_count = len(rec.attendance_ids)
            rec.leave_count = len(rec.leave_ids)
            rec.pending_leave_count = len(
                rec.leave_ids.filtered(lambda l: l.state == 'pending')
            )

    # ── Sequence ──────────────────────────────────────────────────────────────
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('employee_code', 'New') == 'New':
                vals['employee_code'] = self.env['ir.sequence'].next_by_code(
                    'hrms.employee.sequence'
                ) or 'EMP-0000'
        return super().create(vals_list)

    # ── Constraints ───────────────────────────────────────────────────────────
    _sql_constraints = [
        ('employee_code_unique', 'UNIQUE(employee_code)', 'Employee ID must be unique!'),
        ('email_unique', 'UNIQUE(email)', 'Email must be unique!'),
    ]

    @api.constrains('email')
    def _check_email(self):
        pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        for rec in self:
            if rec.email and not re.match(pattern, rec.email):
                raise ValidationError('Invalid email address: %s' % rec.email)

    def name_get(self):
        return [(r.id, '[%s] %s' % (r.employee_code, r.name)) for r in self]

    # ── Smart Buttons ─────────────────────────────────────────────────────────
    def action_view_attendance(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Attendance',
            'res_model': 'hrms.attendance',
            'view_mode': 'list,form',
            'domain': [('employee_id', '=', self.id)],
            'context': {'default_employee_id': self.id},
        }

    def action_view_leaves(self):
        return {
            'type': 'ir.actions.act_window',
            'name': 'Leave Requests',
            'res_model': 'hrms.leave',
            'view_mode': 'list,form',
            'domain': [('employee_id', '=', self.id)],
            'context': {'default_employee_id': self.id},
        }


class HrmsEmployeeDocument(models.Model):
    _name = 'hrms.employee.document'
    _description = 'Employee Document'

    employee_id = fields.Many2one('hrms.employee', required=True, ondelete='cascade')
    name = fields.Char(string='Document Name', required=True)
    document_type = fields.Selection([
        ('id', 'ID Card'), ('passport', 'Passport'), ('contract', 'Contract'),
        ('certificate', 'Certificate'), ('other', 'Other'),
    ], default='other')
    file = fields.Binary(string='File', attachment=True)
    filename = fields.Char(string='Filename')
    date_uploaded = fields.Date(default=fields.Date.today)
    notes = fields.Text()
