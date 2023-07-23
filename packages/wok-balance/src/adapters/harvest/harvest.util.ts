import { DateRange, toNativeDate } from '../../common/date.util'
import { HarvestDateRange } from './models/harvest.model'

export const toHarvestDateRange = ({ startDate, endDate }: Partial<DateRange>): HarvestDateRange => ({
    // from: `${toNativeDate(startDate)}`.replace(/-/g, ''),
    // to: `${toNativeDate(endDate)}`.replace(/-/g, ''),
    from: startDate ? formatHarvestDate(toNativeDate(startDate)) : undefined,
    to: endDate ? formatHarvestDate(toNativeDate(endDate)) : undefined,
})

/** time format: YYYYMMDD */
export const formatHarvestDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()

    return `${year}${month}${day}`
}
