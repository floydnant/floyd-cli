import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenNanoService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = OpenType.Nano
    isReuseWindowSupported = false

    open(directory: string, options: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options.reuseWindow) Logger.getInstance().warn('Reusing windows is not supported with nano.')

        Logger.getInstance().log(`Opening ${directory.yellow} with nano...`.dim)
        this.sysCallService.exec(`nano ${directory}`)
    }

    isInstalled = () => this.sysCallService.testCommand('nano --version')
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install nano'.red)
        process.exit(1)
    }
}
