import { interpolateVariablesWithAllStrategies } from '@flo/common'
import { ConfigService } from '../config/config.service'
import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { CustomOpenPortConfigInput, customOpenPortConfigSchema } from './custom-open.schema'
import { OpenPort } from './open.types'
import { ReuseWindowOptionArg, WaitForCloseOptionArg } from '../../cli/shared.options'

export const createCustomOpenPort = (configInput: CustomOpenPortConfigInput) => {
    const config = customOpenPortConfigSchema.parse(configInput)

    class CustomOpenPort implements OpenPort {
        constructor(
            private sysCallService: SysCallService,
            private configService: ConfigService,
        ) {}

        name = config.name
        supportedTypes = config.supportedTypes
        alwaysReusesWindow = config.alwaysReusesWindow
        alwaysWaitsForClose = config.alwaysWaitsForClose

        canReuseWindow = config.canReuseWindow
        reuseWindowSupportedTypes = config.reuseWindow?.supportedTypes || []

        canWaitForClose = config.canWaitForClose
        waitForCloseSupportedTypes = config.waitForClose?.supportedTypes || []

        open(url: string, options?: Partial<ReuseWindowOptionArg & WaitForCloseOptionArg>) {
            this.assertInstalled()

            if (options?.reuseWindow && !this.canReuseWindow)
                Logger.warn(`Reusing windows is not supported with ${this.name}.`)

            if (options?.waitForClose && !this.canWaitForClose)
                Logger.warn(`Waiting for close is not supported with ${this.name}.`)

            Logger.verbose(`Opening ${url.green} in ${this.name}...`)

            const rawCommand =
                (options?.waitForClose && this.canWaitForClose
                    ? config.waitForClose?.command.trim()
                    : options?.reuseWindow && this.canReuseWindow
                    ? config.reuseWindow?.command.trim()
                    : config.command.trim()) || config.command.trim()

            const result = interpolateVariablesWithAllStrategies(
                rawCommand,
                { url, directory: url, file: url },
                this.configService.config.interpolationStrategies,
            )
            if (Object.keys(result.interpolatedExpressions).length == 0) {
                Logger.error(`Could not interpolate ${url} in ${rawCommand.cyan}.`)

                if (result.unknownIdentifiers.size > 0)
                    Logger.error(`=> Unknown variables: ${[...result.unknownIdentifiers].join(', ')}`)
                // there cannot be any unavailable variables

                return false
            }

            const command = result.interpolated

            try {
                this.sysCallService.execInherit(command)
                return true
            } catch (e) {
                Logger.error(`Failed to open ${url} in ${this.name}.`, `Tried running ${command.cyan}`)
                Logger.debug(e)
                return false
            }
        }

        isInstalled() {
            if (config.checkInstalledCommand)
                return this.sysCallService.testCommand(config.checkInstalledCommand)
            if (config.checkInstalledApp) return this.sysCallService.testApplication(config.checkInstalledApp)

            return true
        }
        assertInstalled() {
            if (this.isInstalled()) return

            throw new Error(`${this.name} is not installed.`)
        }
    }

    return CustomOpenPort
}
