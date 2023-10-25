import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { CustomOpenPortConfig } from './custom-open.schema'
import { OpenPort, OpenType } from './open.types'

export const createCustomOpenPort = (config: CustomOpenPortConfig) => {
    class CustomOpenPort implements OpenPort {
        constructor(private sysCallService: SysCallService) {}

        name = config.name
        isReuseWindowSupported = !!config.reuseWindowCommand
        isFilesSupported = config.supportedTypes.includes(OpenType.File)
        isFoldersSupported = config.supportedTypes.includes(OpenType.Folder)
        isUrlsSupported = config.supportedTypes.includes(OpenType.Url)

        open(url: string, options?: { reuseWindow?: boolean }) {
            this.assertInstalled()

            if (options?.reuseWindow && !this.isReuseWindowSupported)
                Logger.warn(`Reusing windows is not supported with ${this.name}.`)

            Logger.verbose(`Opening ${url.green} in ${this.name}...`)

            const interpolationRegex = /{{\s*(url|directory|file)\s*}}/g
            const command =
                options?.reuseWindow && this.isReuseWindowSupported && config.reuseWindowCommand
                    ? config.reuseWindowCommand.trim().replace(interpolationRegex, url)
                    : config.command.trim().replace(interpolationRegex, url)

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
