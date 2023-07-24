export const mockEmployee = {
    type: 'Employee',
    attributes: {
        id: {
            label: 'ID',
            value: 1,
            type: 'integer',
            universal_id: 'id',
        },
        first_name: {
            label: 'First name',
            value: 'Bob',
            type: 'standard',
            universal_id: 'first_name',
        },
        last_name: {
            label: 'Last name',
            value: 'Vance',
            type: 'standard',
            universal_id: 'last_name',
        },
        email: {
            label: 'Email',
            value: 'bob.vance@vance-refridgeration.fresh',
            type: 'standard',
            universal_id: 'email',
        },
        gender: {
            label: 'Gender',
            value: 'male',
            type: 'standard',
            universal_id: 'gender',
        },
        status: {
            label: 'Status',
            value: 'active',
            type: 'standard',
            universal_id: 'status',
        },
        position: {
            label: 'Position',
            value: 'CEO',
            type: 'standard',
            universal_id: 'position',
        },
        supervisor: {
            label: 'Supervisor',
            value: {
                type: 'Employee',
                attributes: {
                    id: {
                        label: 'ID',
                        value: 2,
                        type: 'integer',
                        universal_id: 'id',
                    },
                },
            },
            type: 'standard',
            universal_id: 'supervisor',
        },
        employment_type: {
            label: 'Employment type',
            value: 'external',
            type: 'standard',
            universal_id: 'employment_type',
        },
        weekly_working_hours: {
            label: 'Weekly hours',
            value: '40',
            type: 'standard',
            universal_id: 'weekly_working_hours',
        },
        hire_date: {
            label: 'Hire date',
            value: '2014-11-09T00:00:00+01:00',
            type: 'date',
            universal_id: 'hire_date',
        },
        contract_end_date: {
            label: 'Contract ends',
            value: null,
            type: 'date',
            universal_id: 'contract_end_date',
        },
        termination_date: {
            label: 'Termination date',
            value: null,
            type: 'date',
            universal_id: 'termination_date',
        },
        termination_type: {
            label: 'Termination type',
            value: null,
            type: 'standard',
            universal_id: 'termination_type',
        },
        termination_reason: {
            label: 'Termination reason',
            value: null,
            type: 'standard',
            universal_id: 'termination_reason',
        },
        probation_period_end: {
            label: 'Probation period end',
            value: null,
            type: 'date',
            universal_id: 'probation_period_end',
        },
        created_at: {
            label: 'created_at',
            value: '2017-05-23T09:49:03+02:00',
            type: 'date',
            universal_id: 'created_at',
        },
        last_modified_at: {
            label: 'Last modified',
            value: '2020-11-18T17:33:55+01:00',
            type: 'date',
            universal_id: 'last_modified_at',
        },
        subcompany: {
            label: 'Subcompany',
            value: {
                type: 'Subcompany',
                attributes: {
                    id: 7033,
                    name: 'CS Demo GmbH',
                },
            },
            type: 'standard',
            universal_id: 'subcompany',
        },
        office: {
            label: 'Office',
            value: {
                type: 'Office',
                attributes: {
                    id: 131014,
                    name: 'Munich',
                },
            },
            type: 'standard',
            universal_id: 'office',
        },
        department: {
            label: 'Department',
            value: {
                type: 'Department',
                attributes: {
                    id: 281521,
                    name: 'Customer Support',
                },
            },
            type: 'standard',
            universal_id: 'department',
        },
        cost_centers: {
            label: 'Cost center',
            value: [
                {
                    type: 'CostCenter',
                    attributes: {
                        id: 82957,
                        name: 'Cost center 1',
                        percentage: 100,
                    },
                },
            ],
            type: 'standard',
            universal_id: 'cost_centers',
        },
        holiday_calendar: {
            label: 'Public holidays',
            value: {
                type: 'HolidayCalendar',
                attributes: {
                    id: 2,
                    name: 'Deutschland (Bayern) Feiertage',
                    country: 'DE',
                    state: 'Bayern',
                },
            },
            type: 'standard',
            universal_id: 'holiday_calendar',
        },
        absence_entitlement: {
            label: 'Absence entitlement',
            value: [
                {
                    type: 'TimeOffType',
                    attributes: {
                        id: 113437,
                        name: 'Paid vacation',
                        category: 'paid_vacation',
                        entitlement: 24,
                    },
                },
            ],
            type: 'standard',
            universal_id: 'absence_entitlement',
        },
        work_schedule: {
            label: 'Work schedule',
            value: {
                type: 'WorkSchedule',
                attributes: {
                    id: 97188,
                    name: 'Full-time, 40 hours without time tracking, (mon,tue,wed,thu,fri)',
                    valid_from: null,
                    monday: '08:00',
                    tuesday: '08:00',
                    wednesday: '08:00',
                    thursday: '08:00',
                    friday: '08:00',
                    saturday: '00:00',
                    sunday: '00:00',
                },
            },
            type: 'standard',
            universal_id: 'work_schedule',
        },
        fix_salary: {
            label: 'Fix salary',
            value: 3000,
            type: 'decimal',
            universal_id: 'fix_salary',
            currency: 'EUR',
        },
        fix_salary_interval: {
            label: 'Salary interval',
            value: 'monthly',
            type: 'standard',
            universal_id: 'fix_salary_interval',
        },
        hourly_salary: {
            label: 'Hourly salary',
            value: 0,
            type: 'decimal',
            universal_id: 'hourly_salary',
            currency: 'EUR',
        },
        vacation_day_balance: {
            label: 'Vacation day balance',
            value: 2,
            type: 'decimal',
            universal_id: 'vacation_day_balance',
        },
        last_working_day: {
            label: 'Last day of work',
            value: null,
            type: 'date',
            universal_id: 'last_working_day',
        },
        profile_picture: {
            label: 'Profile Picture',
            value: 'https://api.personio.de/v1/company/employees/1132888/profile-picture',
            type: 'standard',
            universal_id: 'profile_picture',
        },
        team: {
            label: 'Team',
            value: {
                type: 'Team',
                attributes: {
                    id: 59026,
                    name: 'T_X',
                },
            },
            type: 'standard',
            universal_id: 'team',
        },
        dynamic_24407: {
            label: 'Titel',
            value: 'Dr',
            universal_id: null,
            type: 'standard',
        },
        dynamic_21827: {
            label: 'IBAN',
            value: 'DE98 8989 9898 0000 8989 00',
            universal_id: 'iban',
            type: 'standard',
        },
        dynamic_33400: {
            label: 'Anniversary Date',
            value: '2021-01-01',
            universal_id: null,
            type: 'date',
        },
        dynamic_180883: {
            label: 'Birthday',
            value: '1983-08-18',
            universal_id: 'date_of_birth',
            type: 'date',
        },
    },
} as const

export const mockEmployeeResponse = {
    success: true,
    data: mockEmployee,
} as const

export const mockEmployeesResponse = {
    success: true,
    metadata: {
        total_elements: 2,
        current_page: 0,
        total_pages: 3,
    },
    offset: 0,
    limit: 20,
    data: [mockEmployee],
} as const
