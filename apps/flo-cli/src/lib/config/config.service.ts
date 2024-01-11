import { Config } from './config.schemas'
import { readOrInitConfig } from './config.utils'

// @TODO: @floydnant we can read local configs easily by checking the current worktreeRoot for `.flo-cli/`
// or fall back to manually traversing if no git repo is used

export class ConfigService {
    /** Do not use this constructor directly, use `ConfigService.init()` instead */
    constructor() {
        const { config, rawConfigFile } = readOrInitConfig()
        this.config = config
        this.rawConfigFile = rawConfigFile
    }

    readonly config!: Config
    readonly rawConfigFile!: string

    // @TODO: Come up with a way to update config files without
    // - overwriting comments
    // - mixing up the order of the keys
    // - mixing up local and global config

    private static instance: ConfigService
    static init(...args: ConstructorParameters<typeof ConfigService>) {
        this.instance = new ConfigService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${ConfigService.name} not initialized`)
        return this.instance
    }
}
