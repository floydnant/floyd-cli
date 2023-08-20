// eslint-disable-next-line @nx/enforce-module-boundaries
import { interpolateVariables } from '../../../../../packages/common/src'
import { GitRepository, getRepoRootDir } from '../../adapters/git'
import { Config } from './config.schemas'
import { readOrInitConfig } from './config.utils'
import { globalPaths } from './config.vars'

// @TODO: @floydnant we can read local configs easily by checking the current worktreeRoot for `.flo-cli/`
// or fall back to manually traversing if no git repo is used

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
    contextVariables = {
        ...globalPaths,
        // localConfigRoot: localConfigFolder, // @TODO: @floydnant
        repoRoot: getRepoRootDir() || '<$repoRoot_not_applicable>',
        worktreeRoot: this.currentWorktree?.directory || '<$worktreeRoot_not_applicable>',
        cwd: process.cwd(),
        // will be overwritten at a later point when a worktree is created
        newWorktreeRoot: this.currentWorktree?.directory || '<$newWorktreeRoot_not_applicable>',
    }

    interpolateContextVars(contents: string) {
        const contextVariables = this.contextVariables
        const interpolated = interpolateVariables(contents, contextVariables)

        return interpolated
    }
}
