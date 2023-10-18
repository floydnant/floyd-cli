import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { OpenPort } from './open.types'

export class OpenNanoService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = 'nano'
    isReuseWindowSupported = false
    isFilesSupported = true
    isFoldersSupported = false
    isUrlsSupported = false

    open(directory: string, options?: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options?.reuseWindow) Logger.getInstance().warn('Reusing windows is not supported with nano.')

        Logger.getInstance().log(`Opening ${directory.green} with nano...`.dim)
        try {
            this.sysCallService.execInherit(`nano ${directory}`)
            return true
        } catch (e) {
            Logger.error(`Failed to open ${directory} in nano.`.red)
            Logger.debug(e)
            return false
        }
    }

    isInstalled = () => true
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install nano'.red)
        process.exit(1)
    }
}
