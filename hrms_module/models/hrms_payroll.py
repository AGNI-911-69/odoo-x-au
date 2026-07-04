# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError, UserError


class HrmsPayroll(models.Model):
    _name = 'hrms.payroll'
    _description = 'Payroll Record'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _rec_name = 'display_name'
    _order = 'year desc, month desc'

    display_name = fields.Char(compute='_compute_display_name', store=True)

    employee_id = fields.Many2one(
        'hrms.employee', string='Employee', required=True,
        ondelete='cascade', tracking=True, index=True
    )
    month = fields.Selection([
        ('1', 'January'), ('2', 'February'), ('3', 'March'),
        ('4', 'April'), ('5', 'May'), ('6', 'June'),
        ('7', 'July'), ('8', 'August'), ('9', 'September'),
        ('10', 'October'), ('11', 'November'), ('12', 'December'),
    ], string='Month', required=True, tracking=True)
    year = fields.Integer(
        string='Year', required=True,
        default=lambda s: fields.Date.today().year, tracking=True
    )

    # ── Salary Components ─────────────────────────────────────────────────────
    basic_salary = fields.Float(
        string='Basic Salary', digits=(16, 2), required=True, tracking=True
    )
    house_rent_allowance = fields.Float(
        string='House Rent Allowance (HRA)', digits=(16, 2), default=0.0
    )
    transport_allowance = fields.Float(
        string='Transport Allowance', digits=(16, 2), default=0.0
    )
    medical_allowance = fields.Float(
        string='Medical Allowance', digits=(16, 2), default=0.0
    )
    other_allowances = fields.Float(
        string='Other Allowances', digits=(16, 2), default=0.0
    )
    gross_salary = fields.Float(
        string='Gross Salary', compute='_compute_gross', store=True, digits=(16, 2)
    )

    # ── Deductions ────────────────────────────────────────────────────────────
    tax_deduction = fields.Float(string='Tax Deduction', digits=(16, 2), default=0.0)
    provident_fund = fields.Float(string='Provident Fund', digits=(16, 2), default=0.0)
    other_deductions = fields.Float(string='Other Deductions', digits=(16, 2), default=0.0)
    total_deductions = fields.Float(
        string='Total Deductions', compute='_compute_deductions', store=True, digits=(16, 2)
    )

    # ── Net ───────────────────────────────────────────────────────────────────
    net_salary = fields.Float(
        string='Net Salary', compute='_compute_net', store=True, digits=(16, 2)
    )

    # ── Status ────────────────────────────────────────────────────────────────
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('paid', 'Paid'),
    ], string='Status', default='draft', required=True, tracking=True)

    payment_date = fields.Date(string='Payment Date', tracking=True)
    notes = fields.Text(string='Notes')

    @api.depends('employee_id', 'month', 'year')
    def _compute_display_name(self):
        months = {
            '1': 'Jan', '2': 'Feb', '3': 'Mar', '4': 'Apr',
            '5': 'May', '6': 'Jun', '7': 'Jul', '8': 'Aug',
            '9': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
        }
        for rec in self:
            rec.display_name = '%s - %s %s' % (
                rec.employee_id.name or '',
                months.get(rec.month, ''),
                rec.year or '',
            )

    @api.depends('basic_salary', 'house_rent_allowance', 'transport_allowance',
                 'medical_allowance', 'other_allowances')
    def _compute_gross(self):
        for rec in self:
            rec.gross_salary = (
                rec.basic_salary + rec.house_rent_allowance +
                rec.transport_allowance + rec.medical_allowance +
                rec.other_allowances
            )

    @api.depends('tax_deduction', 'provident_fund', 'other_deductions')
    def _compute_deductions(self):
        for rec in self:
            rec.total_deductions = (
                rec.tax_deduction + rec.provident_fund + rec.other_deductions
            )

    @api.depends('gross_salary', 'total_deductions')
    def _compute_net(self):
        for rec in self:
            rec.net_salary = rec.gross_salary - rec.total_deductions

    # ── Workflow ──────────────────────────────────────────────────────────────
    def action_confirm(self):
        for rec in self:
            if rec.state != 'draft':
                raise UserError('Only draft payrolls can be confirmed.')
            rec.write({'state': 'confirmed'})

    def action_mark_paid(self):
        for rec in self:
            if rec.state != 'confirmed':
                raise UserError('Confirm the payroll before marking as paid.')
            rec.write({'state': 'paid', 'payment_date': fields.Date.today()})

    def action_reset_draft(self):
        for rec in self:
            if rec.state == 'paid':
                raise UserError('Paid payroll cannot be reset.')
            rec.write({'state': 'draft'})

    @api.onchange('employee_id')
    def _onchange_employee(self):
        if self.employee_id:
            self.basic_salary = self.employee_id.basic_salary

    _sql_constraints = [
        ('unique_payroll', 'UNIQUE(employee_id, month, year)',
         'Payroll record already exists for this employee, month and year.'),
    ]
