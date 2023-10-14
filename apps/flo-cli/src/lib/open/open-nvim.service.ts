import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenNeovimService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = OpenType.Neovim
    isReuseWindowSupported = false

    open(directory: string, options: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options.reuseWindow) Logger.getInstance().warn('Reusing windows is not supported with neovim.')

        Logger.getInstance().log(`Opening ${directory.yellow} in neovim...`.dim)
        this.sysCallService.exec(`nvim ${directory}`)
    }

    isInstalled = () => this.sysCallService.testCommand('nvim --version')
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install nvim'.red)
        process.exit(1)
    }
}
