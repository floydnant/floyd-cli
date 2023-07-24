import { DateRange } from '@flo/common'
import { PersonioDateRange } from './models/personio.model'

/**
 * @TODO: personio's date format is unknown
 */
export const toPersonioDateRange = ({ startDate, endDate }: Partial<DateRange>): PersonioDateRange => ({
    start_date: startDate ? startDate.toString() : undefined,
    end_date: endDate ? endDate.toString() : undefined,
})
