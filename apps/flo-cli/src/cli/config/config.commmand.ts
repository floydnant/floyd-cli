import { Command } from 'commander'
import { editConfig, readConfig } from '../../lib/config'

const editConfigCommand = new Command()
    .createCommand('edit')
    .description('Opens the config file in your editor')
    .action(() => editConfig())

export const configCommand = new Command()
    .createCommand('config')
    .description('Shows the resolved config')
    .action(() => console.log(readConfig()))
    .addCommand(editConfigCommand)
