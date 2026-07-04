# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError, UserError
from datetime import date


class HrmsLeaveType(models.Model):
    _name = 'hrms.leave.type'
    _description = 'Leave Type'
    _order = 'name'

    name = fields.Char(string='Leave Type', required=True)
    code = fields.Char(string='Code', required=True)
    max_days = fields.Integer(string='Max Days Per Year', default=0)
    color = fields.Char(string='Color', default='#5B2D8E')
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ('code_unique', 'UNIQUE(code)', 'Leave type code must be unique!'),
    ]


class HrmsLeaveBalance(models.Model):
    _name = 'hrms.leave.balance'
    _description = 'Employee Leave Balance'
    _rec_name = 'display_name'

    employee_id = fields.Many2one('hrms.employee', required=True, ondelete='cascade')
    leave_type_id = fields.Many2one('hrms.leave.type', required=True, ondelete='cascade')
    year = fields.Integer(string='Year', default=lambda s: date.today().year)
    allocated_days = fields.Integer(string='Allocated Days', default=0)
    used_days = fields.Float(string='Used Days', compute='_compute_used_days', store=True)
    remaining_days = fields.Float(string='Remaining Days', compute='_compute_used_days', store=True)
    display_name = fields.Char(compute='_compute_display_name', store=True)

    @api.depends('employee_id', 'leave_type_id', 'year')
    def _compute_display_name(self):
        for rec in self:
            rec.display_name = '%s - %s (%s)' % (
                rec.employee_id.name or '',
                rec.leave_type_id.name or '',
                rec.year or '',
            )

    @api.depends('employee_id', 'leave_type_id', 'year', 'allocated_days')
    def _compute_used_days(self):
        Leave = self.env['hrms.leave']
        for rec in self:
            used = Leave.search([
                ('employee_id', '=', rec.employee_id.id),
                ('leave_type_id', '=', rec.leave_type_id.id),
                ('state', '=', 'approved'),
            ])
            total_used = sum(used.mapped('number_of_days'))
            rec.used_days = total_used
            rec.remaining_days = rec.allocated_days - total_used

    _sql_constraints = [
        ('unique_balance', 'UNIQUE(employee_id, leave_type_id, year)',
         'Leave balance record already exists for this employee/type/year.'),
    ]


class HrmsLeave(models.Model):
    _name = 'hrms.leave'
    _description = 'Leave Request'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'display_name'
    _order = 'date_from desc'

    display_name = fields.Char(compute='_compute_display_name', store=True)

    employee_id = fields.Many2one(
        'hrms.employee', string='Employee', required=True,
        ondelete='cascade', tracking=True, index=True
    )
    leave_type_id = fields.Many2one(
        'hrms.leave.type', string='Leave Type', required=True, tracking=True
    )
    date_from = fields.Date(string='From', required=True, tracking=True)
    date_to = fields.Date(string='To', required=True, tracking=True)
    number_of_days = fields.Float(
        string='Days', compute='_compute_days', store=True
    )
    reason = fields.Text(string='Reason / Remarks', tracking=True)

    state = fields.Selection([
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ], string='Status', default='pending', required=True, tracking=True)

    approved_by = fields.Many2one('res.users', string='Approved By', tracking=True)
    approved_date = fields.Datetime(string='Approved Date')
    rejection_reason = fields.Text(string='Rejection Reason', tracking=True)

    @api.depends('employee_id', 'leave_type_id', 'date_from')
    def _compute_display_name(self):
        for rec in self:
            rec.display_name = '%s - %s (%s)' % (
                rec.employee_id.name or '',
                rec.leave_type_id.name or '',
                str(rec.date_from) if rec.date_from else '',
            )

    @api.depends('date_from', 'date_to')
    def _compute_days(self):
        for rec in self:
            if rec.date_from and rec.date_to:
                delta = rec.date_to - rec.date_from
                rec.number_of_days = delta.days + 1
            else:
                rec.number_of_days = 0

    @api.constrains('date_from', 'date_to')
    def _check_dates(self):
        for rec in self:
            if rec.date_from and rec.date_to and rec.date_to < rec.date_from:
                raise ValidationError('"To" date cannot be before "From" date.')

    @api.constrains('employee_id', 'date_from', 'date_to', 'state')
    def _check_overlap(self):
        for rec in self:
            if rec.state == 'rejected':
                continue
            domain = [
                ('employee_id', '=', rec.employee_id.id),
                ('state', 'in', ['pending', 'approved']),
                ('id', '!=', rec.id),
                ('date_from', '<=', rec.date_to),
                ('date_to', '>=', rec.date_from),
            ]
            if self.search_count(domain):
                raise ValidationError(
                    'Leave request overlaps with an existing request for %s.' %
                    rec.employee_id.name
                )

    # ── Workflow Actions ──────────────────────────────────────────────────────
    def action_approve(self):
        for rec in self:
            if rec.state != 'pending':
                raise UserError('Only pending requests can be approved.')
            rec.write({
                'state': 'approved',
                'approved_by': self.env.uid,
                'approved_date': fields.Datetime.now(),
            })
            # update employee status if leave is today
            today = fields.Date.today()
            if rec.date_from <= today <= rec.date_to:
                rec.employee_id.write({'status': 'on_leave'})
            rec.message_post(
                body='Leave request <b>approved</b> by %s.' % self.env.user.name
            )

    def action_reject(self):
        for rec in self:
            if rec.state != 'pending':
                raise UserError('Only pending requests can be rejected.')
            rec.write({'state': 'rejected'})
            rec.message_post(
                body='Leave request <b>rejected</b> by %s.' % self.env.user.name
            )

    def action_reset_to_pending(self):
        for rec in self:
            rec.write({'state': 'pending', 'approved_by': False, 'approved_date': False})
