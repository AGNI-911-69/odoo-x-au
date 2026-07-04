# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import UserError


class HrmsLeaveApprovalWizard(models.TransientModel):
    _name = 'hrms.leave.wizard'
    _description = 'Leave Approval / Rejection Wizard'

    leave_id = fields.Many2one('hrms.leave', string='Leave Request', required=True)
    action = fields.Selection([
        ('approve', 'Approve'),
        ('reject', 'Reject'),
    ], string='Action', required=True, default='approve')
    rejection_reason = fields.Text(string='Rejection Reason')
    comment = fields.Text(string='Comment')

    @api.onchange('action')
    def _onchange_action(self):
        if self.action == 'approve':
            self.rejection_reason = False

    def action_confirm(self):
        self.ensure_one()
        if self.action == 'reject' and not self.rejection_reason:
            raise UserError('Please provide a rejection reason.')
        if self.action == 'approve':
            self.leave_id.action_approve()
            if self.comment:
                self.leave_id.message_post(body=self.comment)
        else:
            self.leave_id.write({'rejection_reason': self.rejection_reason})
            self.leave_id.action_reject()
            if self.comment:
                self.leave_id.message_post(body=self.comment)
        return {'type': 'ir.actions.act_window_close'}
