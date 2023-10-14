// eslint-disable-next-line @nx/enforce-module-boundaries
import { interpolateVariables } from '../../../../../packages/common/src'
import { GitRepository } from '../../adapters/git'
import { Config } from './config.schemas'
import { readOrInitConfig } from './config.utils'
import { globalPaths } from './config.vars'

// @TODO: @floydnant we can read local configs easily by checking the current worktreeRoot for `.flo-cli/`
// or fall back to manually traversing if no git repo is used

export class ConfigService {
    /** Do not use this constructor directly, use `ConfigService.init()` instead */
    constructor(private gitRepo: GitRepository) {
        const { config, rawConfigFile } = readOrInitConfig()
        this.config = config
        this.rawConfigFile = rawConfigFile
    }

    readonly config!: Config
    readonly rawConfigFile!: string
    private currentWorktree = this.gitRepo.getCurrentWorktree()
    contextVariables = {
        ...globalPaths,
        // localConfigRoot: localConfigFolder, // @TODO: @floydnant
        repoRoot: this.gitRepo.getRepoRootDir() || '<$repoRoot_not_applicable>',
        worktreeRoot: this.currentWorktree?.directory || '<$worktreeRoot_not_applicable>',
        cwd: process.cwd(),
        // will be overwritten at a later point when a worktree is created
        newWorktreeRoot: this.currentWorktree?.directory || '<$newWorktreeRoot_not_applicable>',
    }

    // @TODO: Come up with a way to update config files without
    // - overwriting comments
    // - mixing up the order of the keys
    // - mixing up local and global config

    interpolateContextVars(contents: string) {
        const contextVariables = this.contextVariables
        const interpolated = interpolateVariables(contents, contextVariables)

        return interpolated
    }

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
