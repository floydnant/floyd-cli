import { Command } from 'commander'
import { getWokBalanceServices } from '../../core/balance/services'

const printBalance = async () => {
    const { wokBalanceService } = getWokBalanceServices()
    const balance = await wokBalanceService.getBalance({ employeeId: '1' }) // @TODO: get the employeeId from personio

    console.log({ balance })
}

export const wokBalanceCommand = new Command()
    .createCommand('balance')
    .aliases(['bl'])
    .description('Prints the current balance of work hour goal and tracked time')
    .argument('[prNumberOrBranch]', 'PR number or branch name')
    .action(printBalance)
