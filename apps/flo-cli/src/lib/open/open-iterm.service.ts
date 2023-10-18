import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { OpenPort } from './open.types'

export class OpenItermService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = 'iterm'
    isReuseWindowSupported = false
    isFilesSupported = false
    isFoldersSupported = true
    isUrlsSupported = false

    open(directory: string, options?: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options?.reuseWindow) Logger.getInstance().warn('Reusing windows is not supported with iTerm.')

        Logger.getInstance().log(`Opening ${directory.green} with iTerm...`.dim)
        try {
            this.sysCallService.execInherit(`open -a ${this.appName} ${directory}`)
            return true
        } catch (e) {
            Logger.error(`Failed to open ${directory} in iTerm.`.red)
            Logger.debug(e)
            return false
        }
    }
    private appName = 'iTerm.app'

    isInstalled = () => this.sysCallService.testApplication(this.appName)
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install iTerm'.red)
        process.exit(1)
    }
}
