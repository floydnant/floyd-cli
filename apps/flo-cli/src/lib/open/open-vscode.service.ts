import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenVscodeService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = 'vscode'
    get isReuseWindowSupported() {
        return this.isCliInstalled()
    }
    supportedTypes = [OpenType.File, OpenType.Folder]

    open(directory: string, options?: { reuseWindow?: boolean }) {
        this.assertInstalled()

        try {
            if (this.isCliInstalled()) {
                Logger.log(
                    `Opening ${directory.green} in ${
                        options?.reuseWindow ? 'same vscode window' : 'vscode'
                    }...`.dim,
                )
                this.sysCallService.execInherit(
                    `code ${options?.reuseWindow ? '--reuse-window' : ''} ${directory}`,
                )
            } else {
                if (options?.reuseWindow)
                    Logger.warn('Reusing windows is not supported without the vscode CLI.')
                Logger.log(`Opening ${directory.green} in vscode...`.dim)
                this.sysCallService.execInherit(`open -a ${this.appName} ${directory}`)
            }
            return true
        } catch (e) {
            Logger.error(`Failed to open ${directory} in vscode.`.red)
            Logger.debug(e)
            return false
        }
    }

    private appName = 'Visual Studio Code.app'
    isAppInstalled = () => this.sysCallService.testApplication(this.appName)
    isCliInstalled = () => this.sysCallService.testCommand('code --version')

    isInstalled = () => this.isCliInstalled() || this.isAppInstalled()
    assertInstalled() {
        if (this.isInstalled()) return

        throw new Error("Please install vscode and it's cli `code`")
    }
}
