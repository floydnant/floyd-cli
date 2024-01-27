import { Command } from 'commander'
import { ConfigController } from '../../lib/config/config.controller'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { customErrorWriter } from '../../lib/logger.service'
import { OpenController } from '../../lib/open/open.controller'
import { AppOptionArg, WaitForCloseOptionArg, appOption, waitForCloseOption } from '../shared.options'

const editConfigCommand = new Command()
    .createCommand('edit')
    .configureOutput(customErrorWriter)
    .addOption(appOption)
    .addOption(waitForCloseOption)
    .description('Opens the config file in your editor')
    .action(async (options: AppOptionArg & WaitForCloseOptionArg) => {
        const configService = ConfigService.getInstance()
        const contextService = ContextService.getInstance()
        const configController = ConfigController.init(
            configService,
            contextService,
            OpenController.getInstance(),
        )

        await configController.editConfig(options)
    })

export const configCommand = new Command()
    .createCommand('config')
    .configureOutput(customErrorWriter)
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
