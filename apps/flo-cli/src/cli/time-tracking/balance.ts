import { getTimeTrackingServices } from '../../core/time-tracking/services'
import { formatDate, DateRange, Nullable } from '@flo/common'
import { getPaddedStr } from '../../utils'
import { VerboseOption } from '../interfaces'

export async function printTimeTrackingBalance({
    startDate,
    endDate,
    verbose = false,
}: VerboseOption & Nullable<DateRange>) {
    const { timeTrackingService } = getTimeTrackingServices()

    const { dateRange, ...balance } = await timeTrackingService.getBalance({
        employeeId: '1',
        startDate,
        endDate,
    })

    const endDateFormatted = formatDate(dateRange.endDate).yellow
    const startDateFomatted = formatDate(dateRange.startDate).yellow
    console.log(`\nTime tracking balance from ${startDateFomatted} to ${endDateFormatted}`)

    const trackedTimeFormatted = `${balance.trackedTime} hours`.yellow
    const timeGoalFormatted = `${balance.nettoTimeGoal} hours`.yellow
    console.log(`Time goal: ${timeGoalFormatted}, Tracked time: ${trackedTimeFormatted}`)

    const balanceFormatted =
        balance.timeBalance >= 0 ? `+${balance.timeBalance} hours`.green : `${balance.timeBalance} hours`.red
    const fillString = balance.timeBalance >= 0 ? '-'.green : '-'.red
    console.log(getPaddedStr(`\nBalance: ${balanceFormatted}`, fillString) + '\n')

    if (verbose) console.log(balance)
}
