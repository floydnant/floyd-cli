import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenDefaultService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = OpenType.Default
    isReuseWindowSupported = false

    open(url: string, options: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options.reuseWindow)
            Logger.getInstance().warn('Reusing windows is not supported when using the default app.')

        Logger.getInstance().log(`Opening ${url.yellow} in default app...`.dim)
        this.sysCallService.exec(`open ${url}`)
    }

    isInstalled = () => true
    assertInstalled() {
        // noop
    }
}
