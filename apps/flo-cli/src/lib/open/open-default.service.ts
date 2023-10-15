import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenDefaultService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = OpenType.Default
    isReuseWindowSupported = false
    isFilesSupported = true
    isFoldersSupported = true
    isUrlsSupported = true

    open(url: string, options?: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options?.reuseWindow)
            Logger.getInstance().warn('Reusing windows is not supported when using the default app.')

        Logger.getInstance().log(`Opening ${url.green} in default app...`.dim)
        try {
            this.sysCallService.execInherit(`open ${url}`)
            return true
        } catch (e) {
            Logger.error(`Failed to open ${url} in default app.`.red)
            Logger.debug(e)
            return false
        }
    }

    isInstalled = () => true
    assertInstalled() {
        // noop
    }
}
