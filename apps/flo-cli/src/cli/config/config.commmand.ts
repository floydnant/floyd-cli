import { Command } from 'commander'
import { ConfigService } from '../../lib/config/config.service'
import { editConfig } from '../../lib/config/config.utils'
import { globalPaths } from '../../lib/config/config.vars'

const editConfigCommand = new Command()
    .createCommand('edit')
    .description('Opens the config file in your editor')
    .action(() => editConfig())

export const configCommand = new Command()
    .createCommand('config')
    .description('Shows the resolved config')
    .action(() => {
        const configService = ConfigService.getInstance()
        const config = configService.interpolateContextVars(configService.rawConfigFile)

        console.log('With available variables:', configService.contextVariables)
        console.log()
        console.log(globalPaths.configFile.yellow, config)
    })
    .addCommand(editConfigCommand)
