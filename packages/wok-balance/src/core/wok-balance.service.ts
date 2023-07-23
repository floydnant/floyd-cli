import { LocalDateTime } from '@js-joda/core'
import {
    DateRange,
    getDaysBetweenRange,
    getMonthRangeOf,
    getWorkDaysBetweenRange,
    toLocalDateTime,
} from '../common/date.util'
import { HarvestService } from '../adapters/harvest/harvest.service'
import { PersonioService } from '../adapters/personio/personio.service'

export class WokBalanceService {
    constructor(private harvestService: HarvestService, private personioService: PersonioService) {}

    async getBalance(dto: { employeeId: string; startDate?: Date; endDate?: Date }) {
        const now = LocalDateTime.now()
        const currentMonthRange = getMonthRangeOf(now)
        const dateRange: DateRange = {
            startDate: dto.startDate ? toLocalDateTime(dto.startDate) : currentMonthRange.startDate,
            endDate: dto.endDate ? toLocalDateTime(dto.endDate) : now,
            // endDate: dto.endDate ? toLocalDateTime(dto.endDate) : currentMonthRange.endDate,
        }
        const daysInRange = getDaysBetweenRange(dateRange)
        const daysInRangeX = getWorkDaysBetweenRange(dateRange)
        const workdaysInRange = daysInRangeX.length

        const [employeeData, absencesData, timeEntriesData] = await Promise.all([
            this.personioService.getEmployee(dto.employeeId),
            this.personioService.getEmployeeAbsences(dto.employeeId, dateRange),
            this.harvestService.getTimeEntries(dateRange),
        ])

        const employee = employeeData.attributes
        const absencesHours = absencesData.totalHours

        const timeEntriesHours = timeEntriesData.totalHours
        const dailyRate = parseFloat(employee.weekly_working_hours.value) / 5

        const originalGoal = dailyRate * workdaysInRange // @TODO: take holidays into account
        const goal = originalGoal - absencesHours
        const balance = timeEntriesHours - goal

        console.log({
            dateRange,
            daysInRange,
            workdaysInRange,
            dailyRate,
            originalGoal,
            absencesHours,
            goal,
            timeEntriesHours,
            balance,
        })

        return balance
    }
}
