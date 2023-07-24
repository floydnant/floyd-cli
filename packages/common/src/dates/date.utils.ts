import { ChronoUnit, DateTimeFormatter, DayOfWeek, LocalDate, LocalDateTime, YearMonth } from '@js-joda/core'
import { toLocalDate } from './date.converters'

export interface DateRange {
    startDate: LocalDate | LocalDateTime
    endDate: LocalDate | LocalDateTime
}

export const getDaysBetweenRange = (range: DateRange) => {
    const start = toLocalDate(range.startDate)
    const end = toLocalDate(range.endDate)

    return ChronoUnit.DAYS.between(start, end)
}

/**
 * @TODO: holidays into account
 * @param range
 */
export const getBusinesskDaysBetweenRange = (range: DateRange) => {
    const startDate = toLocalDate(range.startDate)
    const endDate = toLocalDate(range.endDate)

    // Create an array to store business days (excluding weekends)
    const businessDays: LocalDate[] = []

    // Start iterating from the start date until the end date
    for (let currentDate = startDate; !currentDate.isAfter(endDate); currentDate = currentDate.plusDays(1)) {
        // Check if the current day is a weekend (Saturday or Sunday)
        const dayOfWeek = currentDate.dayOfWeek()
        if (dayOfWeek !== DayOfWeek.SATURDAY && dayOfWeek !== DayOfWeek.SUNDAY) {
            businessDays.push(currentDate)
        }
    }

    return businessDays
}

export function getMonthRangeOf(date: LocalDate | LocalDateTime = LocalDate.now()): DateRange {
    const yearMonth = YearMonth.from(date)

    return { startDate: yearMonth.atDay(1), endDate: yearMonth.atEndOfMonth() }
}

export const getWeekRangeOf = (date: LocalDate | LocalDateTime = LocalDate.now()): DateRange => {
    const dayOfWeek = date.dayOfWeek().value()
    const startDate = date.minusDays(dayOfWeek - 1)
    const endDate = startDate.plusDays(7)

    return { startDate, endDate }
}

export const formatDate = (date: LocalDate | LocalDateTime) => {
    if (date instanceof LocalDateTime) return date.format(DateTimeFormatter.ofPattern('dd.MM.yyyy HH:mm'))

    return date.format(DateTimeFormatter.ofPattern('dd.MM.yyyy'))
}
