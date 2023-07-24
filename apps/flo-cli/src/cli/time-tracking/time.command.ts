import { Command } from 'commander'
import { parseDate, getWeekRangeOf } from '@flo/common'
import { VerboseOption } from '../interfaces'
import { printTimeTrackingBalance } from './balance'

interface Options extends VerboseOption {
    startDate?: string
    endDate?: string
}

const weekCommand = new Command()
    .createCommand('week')
    .description('Prints the current week balance')
    .option('-v, --verbose', 'Prints an object with more information')
    .action(({ verbose }: VerboseOption) => {
        printTimeTrackingBalance({ verbose, ...getWeekRangeOf() })
    })

export const timeCommand = new Command()
    .createCommand('time')
    .description('Prints the balance of time goal and tracked time between two dates')
    .option(
        '-s, --startDate <date>',
        'Start date of the period to calculate the balance for (default: start of month)',
    )
    .option('-e, --endDate <date>', 'End date of the period to calculate the balance for (default: today)')
    .option('-v, --verbose', 'Prints an object with more information')
    .addHelpText(
        'after',
        '\nValid date inputs include EOM (end of month), SOM (start of month), 2023-01-01, 01.01.2023, 1.1.2023, 1.1, 01/01, 01/01/23, 01/01/2023',
    )
    .action((options: Options) => {
        const startDate = options.startDate ? parseDate(options.startDate) : null
        const endDate = options.endDate ? parseDate(options.endDate) : null

        printTimeTrackingBalance({ verbose: options.verbose, startDate, endDate })
    })
    .addCommand(weekCommand)
