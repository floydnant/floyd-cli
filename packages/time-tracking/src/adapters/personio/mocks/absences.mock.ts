export const mockAbsence = {
    type: 'AbsencePeriod',
    attributes: {
        id: '9bba303f-0fbc-4514-9958-0befa21923fb',
        measurement_unit: 'hour',
        effective_duration: 960,
        employee: {
            type: 'Employee',
            attributes: {
                id: {
                    label: 'id',
                    value: 2367,
                    type: 'integer',
                    universal_id: 'id',
                },
                first_name: {
                    label: 'First name',
                    value: 'Michael',
                    type: 'standard',
                    universal_id: 'first_name',
                },
                last_name: {
                    label: 'Last name',
                    value: 'Miller',
                    type: 'standard',
                    universal_id: 'last_name',
                },
                email: {
                    label: 'Email',
                    value: 'michael.miller@demo.com',
                    type: 'standard',
                    universal_id: 'email',
                },
            },
        },
        absence_type: {
            type: 'AbsenceType',
            attributes: {
                id: '9bba303f-0fbc-4514-9958-0befa21923fb',
                name: 'Absence Type Name',
            },
        },
        certificate: {
            status: 'not-required',
        },
        start: '2022-05-31T22:00:00.0Z',
        end: '2022-06-02T22:00:00.0Z',
        half_day_start: true,
        half_day_end: false,
        comment: 'this is a comment',
        origin: 'web',
        status: 'approved',
        created_by: 1,
        created_at: '2022-06-20T14:29:56.510Z',
        updated_at: '2022-06-20T14:29:56.510Z',
        approved_at: '2022-06-20T14:29:56.510Z',
        breakdowns: [
            {
                date: '2022-06-01',
                effective_duration: 480,
            },
            {
                date: '2022-06-02',
                effective_duration: 480,
            },
        ],
    },
}
export const mockAbsencesResponse = {
    success: true,
    metadata: {
        total_elements: 1,
        current_page: 1,
        total_pages: 1,
    },
    data: [mockAbsence],
    offset: '0,',
    limit: '200,',
} as const
