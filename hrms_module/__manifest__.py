# -*- coding: utf-8 -*-
{
    'name': 'Enterprise HRMS',
    'version': '17.0.1.0.0',
    'category': 'Human Resources',
    'summary': 'Complete HR Management: Employees, Attendance, Leave & Payroll',
    'description': """
Enterprise Human Resource Management System
============================================
Features:
- Role-based access: Admin/HR Officer vs Employee
- Employee Profile Management (kanban + form, limited self-edit)
- Attendance Tracking (check-in/check-out, daily/weekly views, status badges)
- Leave & Time-Off Management (calendar picker, approval workflow, balance tracking)
- Payroll/Salary Management (read-only for employees, full control for HR)
- Admin Dashboard with live KPIs, pending approvals, recent activity
    """,
    'author': 'HRMS Hackathon Team',
    'website': 'https://github.com/AGNI-911-69/odoo-x-au',
    'license': 'LGPL-3',
    'depends': ['base', 'mail', 'web'],
    'data': [
        'security/hrms_security.xml',
        'security/ir.model.access.csv',
        'data/hrms_sequence.xml',
        'views/hrms_employee_views.xml',
        'views/hrms_attendance_views.xml',
        'views/hrms_leave_views.xml',
        'views/hrms_payroll_views.xml',
        'views/hrms_dashboard_views.xml',
        'views/hrms_menus.xml',
    ],
    'demo': [
        'demo/hrms_demo.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'hrms_module/static/src/css/hrms_style.css',
        ],
    },
    'installable': True,
    'application': True,
    'auto_install': False,
}
