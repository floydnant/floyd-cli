import { DateTimeFormatter, LocalDate, YearMonth, ZoneId, ZonedDateTime } from '@js-joda/core'
import { toNativeDate } from './date.converters'

export const newZonedDateTime = (zoneId: ZoneId = ZoneId.UTC) => ZonedDateTime.now(zoneId)
export const newNativeDate = (zoneId: ZoneId = ZoneId.UTC) => toNativeDate(newZonedDateTime(zoneId), zoneId)

export const localDateOf = (year: string | undefined, month: string, day: string) => {
    try {
        return LocalDate.of(
            year ? parseInt(year.padStart(4, '20')) : LocalDate.now().year(),
            parseInt(month),
            parseInt(day),
        )
    } catch {
        return null
    }
}

/**
 * Parses a date string into a LocalDate.
 *
 * Valid formats include:
 * - `7.10.2023`, `07.10.2023`, `07.10.23`
 * - `7.10`, `07.10`, `7.10.`, `07.10.`
 * - `10/7/2023`, `10/7/23`, `10/07/23`, `10/07`
 * - `2023-10-07`
 * - `EOM`, `SOM` - (end of month, start of month)
 *
 * @param dateString The date string to parse
 */
export const parseDate = (dateString: string) => {
    if (dateString.toUpperCase() === 'EOM') return YearMonth.from(LocalDate.now()).atEndOfMonth()
    if (dateString.toUpperCase() === 'SOM') return YearMonth.from(LocalDate.now()).atDay(1)

    const [deDay, deMonth, deYear] = dateString.split('.')
    const deParsed = localDateOf(deYear, deMonth || '', deDay || '')
    if (deParsed) return deParsed

    const [enMonth, enDay, enYear] = dateString.split('/')
    const enParsed = localDateOf(enYear, enMonth || '', enDay || '')
    if (enParsed) return enParsed

    let parsed: LocalDate | null = null
    for (const formatter of [
        undefined,
        DateTimeFormatter.ISO_LOCAL_DATE,
        // DateTimeFormatter.ofPattern('d.M.uuuu'),
        // DateTimeFormatter.ofPattern('d.M.uu'),
        // DateTimeFormatter.ofPattern('d.M'),
        // DateTimeFormatter.ofPattern('dd.MM'),
        // DateTimeFormatter.ofPattern('M/d'),
        // DateTimeFormatter.ofPattern('MM/dd'),
        // DateTimeFormatter.ofPattern('M/d/uu'),
        // DateTimeFormatter.ofPattern('M/d/uuuu'),
    ]) {
        try {
            parsed = LocalDate.parse(dateString, formatter)
            break
        } catch {
            continue
        }
    }

    return parsed
}
