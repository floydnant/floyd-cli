import { Command } from 'commander'
import { ConfigController } from '../../lib/config/config.controller'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { OpenController } from '../../lib/open/open.controller'

const editConfigCommand = new Command()
    .createCommand('edit')
    .description('Opens the config file in your editor')
    .action(async () => {
        const configService = ConfigService.getInstance()
        const contextService = ContextService.getInstance()
        const configController = ConfigController.init(
            configService,
            contextService,
            OpenController.getInstance(),
        )

        await configController.editConfig()
    })

export const configCommand = new Command()
    .createCommand('config')
    .description('Shows the resolved config')
    .action(async () => {
        const configService = ConfigService.getInstance()
        const contextService = ContextService.getInstance()
        const configController = ConfigController.init(
            configService,
            contextService,
            OpenController.getInstance(),
        )

        await configController.printConfig()
    })
    .addCommand(editConfigCommand)
