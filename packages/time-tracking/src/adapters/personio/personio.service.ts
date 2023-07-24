import { DateRange } from '@flo/common'
import { IPersonioRepo } from './personio.repo'

export class PersonioService {
    constructor(private personioRepo: IPersonioRepo) {}

    async getEmployees() {
        return (await this.personioRepo.getEmployees()).data
    }
    async getEmployee(employeeId: string) {
        return (await this.personioRepo.getEmployee(employeeId)).data
    }

    async getEmployeeAbsences(employeeId: string, range?: Partial<DateRange>) {
        const response = await this.personioRepo.getEmployeeAbsences(employeeId, range)
        const totalHours = response.data.reduce((acc, absence) => {
            return acc + absence.attributes.effective_duration / 60
        }, 0)

        return { absences: response.data, totalHours }
    }
}
