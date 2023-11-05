import { ConfigService } from '../config/config.service'
import { SysCallService } from '../sys-call.service'
import { createCustomOpenPort } from './custom-open.service'
import { OpenVscodeService } from './open-vscode.service'
import { OpenPort, OpenServiceConstructor, OpenType } from './open.types'

// @TODO: this needs to get its own file
export interface InstalledCommandPort {
    isInstalled(): boolean
    assertInstalled(): void
}

const OpenDefaultService = createCustomOpenPort({
    name: 'default app',
    command: 'open {{ directory }}',
    supportedTypes: [OpenType.Url, OpenType.File, OpenType.Folder],
})

export class OpenService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private sysCallService: SysCallService,
        private configService: ConfigService,
    ) {
        this.openPorts = [
            OpenVscodeService,
            ...(this.configService.config.openIn?.apps || []).map(createCustomOpenPort),
            OpenDefaultService,
        ]
    }
    private openPorts: OpenServiceConstructor[]

    useAllInstalled(predicate: (openPort: OpenPort) => boolean = () => true) {
        const installedOpenTypes = this.openPorts
            .map(OpenPort => new OpenPort(this.sysCallService, this.configService))
            .filter(openPort => predicate(openPort) && openPort.isInstalled())

        if (installedOpenTypes.length === 0)
            installedOpenTypes.push(new OpenDefaultService(this.sysCallService, this.configService))

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
