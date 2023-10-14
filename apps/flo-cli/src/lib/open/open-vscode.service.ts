import { ExecutionService } from '../exec.service'
import { Logger } from '../logger.service'
import { OpenPort, OpenType } from './open.types'

export class OpenVscodeService implements OpenPort {
    constructor(private exec: ExecutionService) {}

    name = OpenType.Vscode
    isReuseWindowSupported = true

    open(directory: string, options: { reuseWindow?: boolean }) {
        this.assertInstalled()

        Logger.getInstance().log(
            `Opening ${directory.yellow} in ${options?.reuseWindow ? 'same' : 'new'} vscode window...`.dim,
        )
        this.exec.exec(`code ${options?.reuseWindow ? '--reuse-window' : ''} ${directory}`)
    }

    isInstalled = () => this.exec.testCommand('code --version')
    assertInstalled() {
        if (this.isInstalled()) return

        Logger.error('Please install vscode cli `code`'.red)
        process.exit(1)
    }
}
