import { DateRange } from '../../common/date.util'
import { IHarvestRepo } from './harvest.repo'

export class HarvestService {
    constructor(private harvestRepo: IHarvestRepo) {}

    async getTimeEntries(dateRange?: Partial<DateRange>) {
        const data = await this.harvestRepo.getTimeEntries(dateRange)

        // @TODO: perhaps the time entries should be filtered by the time of the day in the dateRange
        const totalHours = data.time_entries.reduce((acc, curr) => {
            return acc + curr.hours
        }, 0)

        return { timeEntries: data.time_entries, totalHours }
    }
}
