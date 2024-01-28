import { SysCallService } from '../sys-call.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'
import { ReuseWindowOptionArg, WaitForCloseOptionArg } from '../../cli/shared.options'
import { makeFlags } from '../utils'

export class OpenVscodeService implements OpenPort {
    constructor(private sysCallService: SysCallService) {}

    name = 'vscode'
    supportedTypes = [OpenType.File, OpenType.Folder]
    alwaysReusesWindow = false
    alwaysWaitsForClose = false

    get canReuseWindow() {
        return this.isCliInstalled()
    }
    reuseWindowSupportedTypes = [OpenType.Folder]

    get canWaitForClose() {
        return this.isCliInstalled()
    }
    waitForCloseSupportedTypes = [OpenType.File]

    open(directory: string, options?: Partial<ReuseWindowOptionArg & WaitForCloseOptionArg>) {
        this.assertInstalled()

        try {
            if (this.isCliInstalled()) {
                Logger.log(
                    `Opening ${directory.green} in ${options?.reuseWindow ? 'same vscode window' : 'vscode'}${
                        options?.waitForClose ? ' and waiting for it to be closed' : ''
                    }...`.dim,
                )

                this.sysCallService.execInherit(
                    `code ${makeFlags({
                        '--reuse-window': options?.reuseWindow,
                        '--wait': options?.waitForClose,
                    })} ${directory}`,
                )
            } else {
                if (options?.reuseWindow)
                    Logger.warn('Reusing windows is not supported without the vscode CLI.')
                if (options?.waitForClose)
                    Logger.warn('Waiting for close is not supported without the vscode CLI.')

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
