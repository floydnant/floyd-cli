import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { OpenDefaultService } from './open-default.service'
import { OpenNanoService } from './open-nano.service'
import { OpenNeovimService } from './open-nvim.service'
import { OpenVimService } from './open-vim.service'
import { OpenVscodeService } from './open-vscode.service'
import { OpenServiceConstructor, OpenType } from './open.types'

// @TODO: this needs to get its own file
export interface InstalledCommandPort {
    isInstalled(): boolean
    assertInstalled(): void
}

const openServiceMap: Record<OpenType, OpenServiceConstructor> = {
    [OpenType.Vscode]: OpenVscodeService,
    [OpenType.Neovim]: OpenNeovimService,
    [OpenType.Vim]: OpenVimService,
    [OpenType.Nano]: OpenNanoService,
    [OpenType.Default]: OpenDefaultService,
}

export class OpenService {
    /** Do not use this constructor directly, use `OpenService.init()` instead */
    constructor(private sysCallService: SysCallService) {}

    use(openType: OpenType) {
        const openService = new openServiceMap[openType](this.sysCallService)
        if (openService.isInstalled()) return openService

        Logger.log(`App ${openType.cyan} not installed, falling back to default`)
        return new openServiceMap[OpenType.Default](this.sysCallService)
    }

    useFirst(...prioritizedOpenTypes: OpenType[]) {
        const openTypes = new Set([...prioritizedOpenTypes, ...Object.values(OpenType)])

        for (const openType of openTypes) {
            const openService = new openServiceMap[openType](this.sysCallService)
            if (!openService.isInstalled()) continue

            return openService
        }

        // This should never happen, since we always have a default
        Logger.error(
            `No supported application found. Tried: ${Array.from(openTypes)
                .map(openType => openType.cyan)
                .join(', ')}`,
        )
        process.exit(1)
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
