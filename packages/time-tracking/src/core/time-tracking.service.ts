import { LocalDateTime } from '@js-joda/core'
import { HarvestService, PersonioService } from '../adapters'
import {
    DateRange,
    Nullable,
    getBusinesskDaysBetweenRange,
    getDaysBetweenRange,
    getMonthRangeOf,
} from '@flo/common'

export interface GetBalanceQuery extends Nullable<DateRange> {
    employeeId: string
}

export class TimeTrackingService {
    constructor(
        private harvestService: HarvestService,
        private personioService: PersonioService,
    ) {}

    async getBalance(query: GetBalanceQuery) {
        const now = LocalDateTime.now()
        const dateRange: DateRange = {
            startDate: query.startDate ?? getMonthRangeOf(now).startDate,
            endDate: query.endDate ?? now,
        }
        const daysInRange = getDaysBetweenRange(dateRange)
        const businessDaysInRange = getBusinesskDaysBetweenRange(dateRange).length

        const [employeeData, absencesData, timeEntriesData] = await Promise.all([
            this.personioService.getEmployee(query.employeeId),
            this.personioService.getEmployeeAbsences(query.employeeId, dateRange),
            this.harvestService.getTimeEntries(dateRange),
        ])

        const employee = employeeData.attributes
        const absencesTime = absencesData.totalHours

        const trackedTime = timeEntriesData.totalHours
        const employeeDailyHourRate = parseFloat(employee.weekly_working_hours.value) / 5

        const bruttoTimeGoal = employeeDailyHourRate * businessDaysInRange // @TODO: take holidays into account
        const nettoTimeGoal = bruttoTimeGoal - absencesTime
        const timeBalance = trackedTime - nettoTimeGoal

        return {
            dateRange,
            daysInRange,
            businessDaysInRange,
            employeeDailyHourRate,
            bruttoTimeGoal,
            absencesTime,
            nettoTimeGoal,
            trackedTime,
            timeBalance,
        }
    }
}
