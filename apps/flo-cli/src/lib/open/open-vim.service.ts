import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { OpenPort } from './open.types'

export class OpenVimService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = 'vim'
    isReuseWindowSupported = false
    isFilesSupported = true
    isFoldersSupported = true
    isUrlsSupported = false

    open(directory: string, options?: { reuseWindow?: boolean }) {
        this.assertInstalled()

        if (options?.reuseWindow) Logger.getInstance().warn('Reusing windows is not supported with vim.')

        Logger.getInstance().log(`Opening ${directory.green} with vim...`.dim)
        try {
            this.sysCallService.execInherit(`vim ${directory}`)
            return true
        } catch (e) {
            Logger.error(`Failed to open ${directory} in vim.`.red)
            Logger.debug(e)
            return false
        }
    }

    isInstalled = () => this.sysCallService.testCommand('vim --version')
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install vim'.red)
        process.exit(1)
    }
}
