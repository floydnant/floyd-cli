// eslint-disable-next-line @nx/enforce-module-boundaries
import { interpolateVariables } from '../../../../../packages/common/src'
import { GitRepository, getRepoRootDir } from '../../adapters/git'
import { Config } from './config.schemas'
import { readOrInitConfig } from './config.utils'
import { globalPaths } from './config.vars'

export class ConfigService {
    private constructor() {
        const { config, rawConfigFile } = readOrInitConfig()
        this.config = config
        this.rawConfigFile = rawConfigFile
    }

    private static instance: ConfigService | null = null
    static getInstance(): ConfigService {
        if (!this.instance) this.instance = new this()
        return this.instance
    }

    readonly config!: Config
    readonly rawConfigFile!: string
    private currentWorktree = GitRepository.getInstance().getCurrentWorktree()
    readonly contextVariables = {
        ...globalPaths,
        // localConfigRoot: localConfigFolder,
        repoRoot: getRepoRootDir(),
        worktreeRoot: this.currentWorktree?.dir || '<not-applicable>',
        cwd: process.cwd(),
        // will be overwritten at a later point when a worktree is created
        newWorktreeRoot: this.currentWorktree?.dir || '<not-applicable>',
    }

    interpolateContextVars(contents: string) {
        const contextVariables = this.contextVariables
        const interpolated = interpolateVariables(contents, contextVariables)

        return interpolated
    }
}
