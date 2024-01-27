import { InterpolationStrategy } from '@flo/common'
import { Logger } from '../logger.service'
import { OpenController } from '../open/open.controller'
import { ConfigService } from './config.service'
import { globalPaths } from './config.vars'
import { ContextService } from './context.service'
import { AppOptionArg, WaitForCloseOptionArg } from '../../cli/shared.options'

export class ConfigController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private configService: ConfigService,
        private contextService: ContextService,
        private openController: OpenController,
    ) {}

    async editConfig(options?: Partial<AppOptionArg & WaitForCloseOptionArg>) {
        return await this.openController.openFile(globalPaths.configFile, {
            subject: 'config file',
            app: options?.app,
            waitForClose: options?.waitForClose,
        })
    }
    async printConfig() {
        const config = this.contextService.interpolateContextVars(this.configService.rawConfigFile, false)
        Logger.log('With available variables:', this.contextService.context)
        Logger.log()
        Logger.warn(
            `Note: interpolation strategy ${InterpolationStrategy.Javascript} is not applied when using this command`,
        )
        Logger.log()
        Logger.log(globalPaths.configFile.yellow, config)
    }

    private static instance: ConfigController
    static init(...args: ConstructorParameters<typeof ConfigController>) {
        if (this.instance) {
            Logger.warn(`${ConfigController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new ConfigController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${ConfigController.name} not initialized`)
        return this.instance
    }
}
