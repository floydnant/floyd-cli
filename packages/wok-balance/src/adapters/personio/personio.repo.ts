import axios from 'axios'
import { DateRange } from '../../common/date.util'
import { interpolateParams } from '../../common/string.util'
import { mockAbsencesResponse } from './mocks/absences.mock'
import { mockEmployeeResponse, mockEmployeesResponse } from './mocks/employees.mock'
import { AbsencesResponse } from './models/absences.model'
import { EmployeeResponse, EmployeesResponse } from './models/employee.model'
import { PersonioConfig } from './personio.config'
import { toPersonioDateRange } from './personio.util'

export interface IPersonioRepo {
    getEmployees(): Promise<EmployeesResponse>
    getEmployee(employeeId: string): Promise<EmployeeResponse>
    getEmployeeAbsences(employeeId: string, range?: Partial<DateRange>): Promise<AbsencesResponse>
}

export class PersonioRepo implements IPersonioRepo {
    constructor(private config: PersonioConfig) {}

    private axios = axios.create({
        baseURL: this.config.PERSONIO_BASE_URL,
        headers: {
            Authorization: `Bearer ${this.config.PERSONIO_API_TOKEN}`, // if doesn't work, try prefixing with 'papi-'
            'X-Personio-App-ID': 'FLOYD_WOK_BALANCE',
        },
    })

    async getEmployees() {
        const endpoint = '/company/employees'
        const response = await this.axios.get<EmployeesResponse>(endpoint)

        return response.data
    }

    async getEmployee(employeeId: string) {
        // @see https://developer.personio.de/reference/get_company-employees-employee-id
        const endpoint = interpolateParams('/company/employees/:empolyeeId', { employeeId })
        const response = await this.axios.get<EmployeeResponse>(endpoint)

        return response.data
    }

    async getEmployeeAbsences(employeeId: string, dateRange?: Partial<DateRange>) {
        // @see https://developer.personio.de/reference/get_company-absence-periods
        const endpoint = '/company/absence-periods'
        const personioDateRange = dateRange ? toPersonioDateRange(dateRange) : {}
        const params = { employees: [employeeId], ...personioDateRange }

        const response = await this.axios.get<AbsencesResponse>(endpoint, { params })

        return response.data
    }
}

export class MockPersonioRepo implements IPersonioRepo {
    async getEmployees() {
        return mockEmployeesResponse
    }

    async getEmployee() {
        return mockEmployeeResponse
    }

    async getEmployeeAbsences() {
        return mockAbsencesResponse
    }
}
