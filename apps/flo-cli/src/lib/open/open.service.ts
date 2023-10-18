import { SysCallService } from '../sys-call.service'
import { OpenDefaultService } from './open-default.service'
import { OpenItermService } from './open-iterm.service'
import { OpenNanoService } from './open-nano.service'
import { OpenNeovimService } from './open-nvim.service'
import { OpenVimService } from './open-vim.service'
import { OpenVscodeService } from './open-vscode.service'
import { OpenPort, OpenServiceConstructor } from './open.types'

// @TODO: this needs to get its own file
export interface InstalledCommandPort {
    isInstalled(): boolean
    assertInstalled(): void
}

const openPorts: OpenServiceConstructor[] = [
    OpenVscodeService,
    OpenNeovimService,
    OpenVimService,
    OpenNanoService,
    OpenItermService,
    OpenDefaultService,
]

export class OpenService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private sysCallService: SysCallService) {}

    useAllInstalled(predicate: (openPort: OpenPort) => boolean = () => true) {
        const installedOpenTypes = openPorts
            .map(OpenPort => new OpenPort(this.sysCallService))
            .filter(openPort => predicate(openPort) && openPort.isInstalled())

        if (installedOpenTypes.length === 0)
            installedOpenTypes.push(new OpenDefaultService(this.sysCallService))

        return installedOpenTypes
    }

    private static instance: OpenService
    static init(...args: ConstructorParameters<typeof OpenService>) {
        this.instance = new OpenService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${OpenService.name} not initialized`)
        return this.instance
    }
}
