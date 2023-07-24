import { LocalDate, YearMonth } from '@js-joda/core'
import {
    DateRange,
    getBusinesskDaysBetweenRange,
    getDaysBetweenRange,
    getMonthRangeOf,
    getWeekRangeOf,
} from './date.util'
import { localDateOf, parseDate } from './date.constructors'

vitest.setSystemTime(new Date('2023-08-15T00:00:00.000Z'))

describe('Dates', () => {
    describe.todo('converters')

    describe('constructors', () => {
        describe(`${localDateOf.name}()`, () => {
            it('can transform input into LocalDate', () => {
                const expectedDate = LocalDate.of(2023, 10, 7)
                const dateInputs: [year: string | undefined, month: string, day: string][] = [
                    ['23', '10', '7'],
                    ['2023', '10', '7'],
                    ['2023', '10', '07'],
                    ['', '10', '7'],
                    [undefined, '10', '7'],
                ]

                const parsedDates = dateInputs.map(params => localDateOf(...params))

                expect(parsedDates).toEqual(Array(dateInputs.length).fill(expectedDate))
            })

            it.todo('cannot parse invalid input')
        })

        describe(`${parseDate.name}()`, () => {
            it('can parse dates', () => {
                const expectedDate = LocalDate.of(2023, 10, 7)
                const dateInputs = [
                    '7.10.2023',
                    '07.10.2023',
                    '7.10.23',
                    '07.10.23',
                    '7.10',
                    '07.10',
                    '7.10.',
                    '07.10.',
                    '10/7/2023',
                    '10/07/2023',
                    '10/7/23',
                    '10/07/23',
                    '10/7',
                    '10/07',
                    '2023-10-07',
                ]

                const parsedDates = dateInputs.map(dateString => parseDate(dateString))

                expect(parsedDates).toEqual(Array(dateInputs.length).fill(expectedDate))
            })

            it('can parse abbreviations', () => {
                const startOfCurrentMonth = LocalDate.of(2023, 8, 1)
                const endOfCurrentMonth = LocalDate.of(2023, 8, 31)

                const parsedStart = parseDate('SOM')
                const parsedEnd = parseDate('EOM')

                expect(parsedStart).toEqual(startOfCurrentMonth)
                expect(parsedEnd).toEqual(endOfCurrentMonth)
            })

            it.todo('cannot parse invalid dates')
        })
    })

    describe('utils', () => {
        describe(`${getMonthRangeOf.name}()`, () => {
            it('can get the month range of a given date', () => {
                const now = LocalDate.now()
                const currentMonth = YearMonth.from(now)
                const expectedRange: DateRange = {
                    startDate: currentMonth.atDay(1),
                    endDate: currentMonth.atEndOfMonth(),
                }

                const range = getMonthRangeOf(now)

                expect(range).toEqual(expectedRange)
            })
        })

        describe(`${getWeekRangeOf.name}()`, () => {
            it('can get the week range of a given date', () => {
                const now = LocalDate.now()
                const startDate = LocalDate.of(2023, 8, 14)
                const endDate = LocalDate.of(2023, 8, 21)
                const expectedRange: DateRange = { startDate, endDate }

                const range = getWeekRangeOf(now)

                expect(range).toEqual(expectedRange)
            })
        })

        describe(`${getDaysBetweenRange.name}()`, () => {
            it('can get the days between two dates', () => {
                const startDate = LocalDate.of(2023, 10, 7)
                const endDate = LocalDate.of(2023, 10, 10)
                const expectedDays = 3

                const days = getDaysBetweenRange({ startDate, endDate })

                expect(days).toEqual(expectedDays)
            })
        })

        describe(`${getBusinesskDaysBetweenRange.name}()`, () => {
            it('can get the business days between two dates', () => {
                const matrix: [range: DateRange, expectedDays: number][] = [
                    [{ startDate: LocalDate.of(2023, 10, 7), endDate: LocalDate.of(2023, 10, 10) }, 2],
                    [{ startDate: LocalDate.of(2023, 7, 16), endDate: LocalDate.of(2023, 7, 23) }, 5],
                    [{ startDate: LocalDate.of(2023, 6, 28), endDate: LocalDate.of(2023, 7, 5) }, 6],
                ]

                matrix.forEach(([range, expectedDays]) => {
                    const days = getBusinesskDaysBetweenRange(range)

                    expect(days.length).toEqual(expectedDays)
                })
            })
        })
    })
})
