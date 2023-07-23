import {
    DayOfWeek,
    Instant,
    LocalDate,
    LocalDateTime,
    YearMonth,
    ZoneId,
    ZonedDateTime,
    convert,
    nativeJs,
} from '@js-joda/core'

export const newZonedDateTime = (zoneId: ZoneId = ZoneId.UTC) => ZonedDateTime.now(zoneId)
export const newNativeDate = (zoneId: ZoneId = ZoneId.UTC) => toNativeDate(newZonedDateTime(zoneId), zoneId)

/**
 * Converts any js-joda date format to native Date.
 * @param date LocalDate, ZonedDateTime or LocalDateTime | Instant
 * @param zoneId zone ID for the native Date (default: UTC)
 */
export const toNativeDate = (
    date: LocalDate | ZonedDateTime | LocalDateTime | Instant,
    zoneId: ZoneId = ZoneId.UTC,
): Date => convert(date, zoneId).toDate()

/** Converts any native or js-joda date format to LocalDate (at the start of the day). */
export const toLocalDate = (
    date: Date | ZonedDateTime | LocalDateTime | LocalDate,
    zoneId: ZoneId = ZoneId.UTC,
): LocalDate => {
    if (date instanceof LocalDate) return date
    if (date instanceof ZonedDateTime || date instanceof LocalDateTime) {
        return date.toLocalDate()
    }

    return nativeJs(date, zoneId).toLocalDate()
}

/** Converts any native or js-joda date format to LocalDate (at the start of the day). */
export const toLocalDateTime = (
    date: Date | ZonedDateTime | LocalDate | LocalDateTime,
    zoneId: ZoneId = ZoneId.UTC,
): LocalDateTime => {
    if (date instanceof LocalDateTime) return date
    if (date instanceof ZonedDateTime) return date.toLocalDateTime()
    if (date instanceof LocalDate) return date.atStartOfDay()

    return nativeJs(date, zoneId).toLocalDateTime()
}

/**
 * Converts any native or js-joda date format to ZonedDateTime.
 * @param date native Date, LocalDate or ZonedDateTime
 * @param zoneId zone ID for the ZonedDateTime (default: UTC)
 */
export const toZonedDateTime = (date: Date | LocalDate, zoneId: ZoneId = ZoneId.UTC): ZonedDateTime => {
    if (date instanceof LocalDate) {
        return date.atStartOfDay().atZone(zoneId)
    }

    return nativeJs(date, zoneId)
}

export interface DateRange {
    startDate: LocalDate | LocalDateTime
    endDate: LocalDate | LocalDateTime
}

export const getDaysBetweenRange = (range: DateRange) => {
    const start = toLocalDate(range.startDate)
    const end = toLocalDate(range.endDate)

    return start.until(end).days()
}
/**
 * @TODO: take weekends & holidays into account
 * @param range
 */
export const getWorkDaysBetweenRange = (range: DateRange) => {
    const startDate = toLocalDate(range.startDate) /* .dayOfWeek() == DayOfWeek.SATURDAY ? 1 : 0 */
    const endDate = toLocalDate(range.endDate)
    // return start.until(end).days()

    // Create an array to store business days (excluding weekends)
    const businessDays = []

    // Start iterating from the start date until the end date
    for (let currentDate = startDate; !currentDate.isAfter(endDate); currentDate = currentDate.plusDays(1)) {
        // Check if the current day is a weekend (Saturday or Sunday)
        const dayOfWeek = currentDate.dayOfWeek()
        if (dayOfWeek !== DayOfWeek.SATURDAY && dayOfWeek !== DayOfWeek.SUNDAY) {
            businessDays.push(currentDate)
        }
    }

    // Return the array of business days
    return businessDays
}

export function getMonthRangeOf(localDateTime = LocalDateTime.now()) {
    // const currentYearMonth = YearMonth.of(year, month)
    const yearMonth = YearMonth.from(localDateTime)

    return {
        startDate: yearMonth.atDay(1),
        endDate: yearMonth.atEndOfMonth(),
    } satisfies DateRange
}
