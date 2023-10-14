import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenVimService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = OpenType.Vim
    isReuseWindowSupported = false

    open(directory: string, options: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options.reuseWindow) Logger.getInstance().warn('Reusing windows is not supported with vim.')

        Logger.getInstance().log(`Opening ${directory.yellow} with vim...`.dim)
        this.sysCallService.exec(`nvim ${directory}`)
    }

    isInstalled = () => this.sysCallService.testCommand('vim --version')
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install vim'.red)
        process.exit(1)
    }
}
