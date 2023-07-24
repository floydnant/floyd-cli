import { LocalDate, ZonedDateTime, LocalDateTime, Instant, ZoneId, convert, nativeJs } from '@js-joda/core'

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
