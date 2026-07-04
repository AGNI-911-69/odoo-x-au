# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError, UserError
from datetime import datetime, timedelta


class HrmsAttendance(models.Model):
    _name = 'hrms.attendance'
    _description = 'HRMS Attendance'
    _inherit = ['mail.thread']
    _rec_name = 'display_name'
    _order = 'date desc, employee_id asc'

    employee_id = fields.Many2one(
        'hrms.employee', string='Employee', required=True,
        ondelete='cascade', tracking=True, index=True
    )
    date = fields.Date(
        string='Date', required=True, default=fields.Date.today, tracking=True
    )
    check_in = fields.Datetime(string='Check-In', tracking=True)
    check_out = fields.Datetime(string='Check-Out', tracking=True)

    status = fields.Selection([
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half-Day'),
        ('on_leave', 'On Leave'),
    ], string='Status', default='absent', required=True, tracking=True)

    work_hours = fields.Float(
        string='Work Hours', compute='_compute_work_hours', store=True, digits=(5, 2)
    )
    work_hours_display = fields.Char(
        string='Work Hours', compute='_compute_work_hours_display', store=True
    )
    notes = fields.Text(string='Notes')

    display_name = fields.Char(compute='_compute_display_name', store=True)

    @api.depends('employee_id', 'date')
    def _compute_display_name(self):
        for rec in self:
            emp = rec.employee_id.name or ''
            dt = str(rec.date) if rec.date else ''
            rec.display_name = '%s - %s' % (emp, dt)

    @api.depends('check_in', 'check_out')
    def _compute_work_hours(self):
        for rec in self:
            if rec.check_in and rec.check_out:
                delta = rec.check_out - rec.check_in
                rec.work_hours = delta.total_seconds() / 3600.0
            else:
                rec.work_hours = 0.0

    @api.depends('work_hours')
    def _compute_work_hours_display(self):
        for rec in self:
            h = int(rec.work_hours)
            m = int((rec.work_hours - h) * 60)
            rec.work_hours_display = '%dh %02dm' % (h, m)

    @api.constrains('check_in', 'check_out')
    def _check_times(self):
        for rec in self:
            if rec.check_in and rec.check_out:
                if rec.check_out < rec.check_in:
                    raise ValidationError('Check-Out cannot be before Check-In.')

    @api.constrains('employee_id', 'date')
    def _check_unique_attendance(self):
        for rec in self:
            domain = [
                ('employee_id', '=', rec.employee_id.id),
                ('date', '=', rec.date),
                ('id', '!=', rec.id),
            ]
            if self.search_count(domain):
                raise ValidationError(
                    'Attendance record already exists for %s on %s.' % (
                        rec.employee_id.name, rec.date
                    )
                )

    @api.onchange('check_in', 'check_out')
    def _onchange_auto_status(self):
        for rec in self:
            if rec.check_in and rec.check_out:
                hours = (rec.check_out - rec.check_in).total_seconds() / 3600.0
                if hours >= 4:
                    rec.status = 'present'
                else:
                    rec.status = 'half_day'
            elif rec.check_in and not rec.check_out:
                rec.status = 'present'

    # ── Check-In / Check-Out actions ─────────────────────────────────────────
    def action_check_in(self):
        self.ensure_one()
        if self.check_in:
            raise UserError('Already checked in.')
        self.write({
            'check_in': fields.Datetime.now(),
            'status': 'present',
        })
        self.employee_id.write({'status': 'present'})

    def action_check_out(self):
        self.ensure_one()
        if not self.check_in:
            raise UserError('Please check in first.')
        if self.check_out:
            raise UserError('Already checked out.')
        self.write({'check_out': fields.Datetime.now()})
        # auto-set status
        self._compute_work_hours()
        if self.work_hours < 4:
            self.status = 'half_day'

    # ── Quick Check-In for employee (creates today's record if missing) ───────
    @api.model
    def employee_check_in(self, employee_id):
        today = fields.Date.today()
        record = self.search([
            ('employee_id', '=', employee_id),
            ('date', '=', today),
        ], limit=1)
        if not record:
            record = self.create({
                'employee_id': employee_id,
                'date': today,
                'check_in': fields.Datetime.now(),
                'status': 'present',
            })
        else:
            record.action_check_in()
        return record.id

    @api.model
    def employee_check_out(self, employee_id):
        today = fields.Date.today()
        record = self.search([
            ('employee_id', '=', employee_id),
            ('date', '=', today),
        ], limit=1)
        if record:
            record.action_check_out()
        return record.id if record else False
