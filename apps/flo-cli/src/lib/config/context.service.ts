import { interpolateVariablesWithAllStrategies } from '@flo/common'
import { GitRepository } from '../../adapters/git'
import { Logger } from '../logger.service'
import { cacheable } from '../utils'
import { ConfigService } from './config.service'
import { globalPaths } from './config.vars'

export type CliContext = {
    repoRoot: string
    worktreeRoot: string
    cwd: string
    newWorktreeRoot: string
    // localConfigRoot: string
    cliVersion: string
}

export class ContextService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private configService: ConfigService,
    ) {}

    private getContext = cacheable((): CliContext & typeof globalPaths => {
        const currentWorktree = this.gitRepo.getCurrentWorktree()
        // @TODO: pass cwd as an option
        const cwd = process.cwd()
        return {
            ...globalPaths,
            // localConfigRoot: localConfigFolder, // @TODO: @floydnant
            repoRoot: this.gitRepo.getRepoRootDir(cwd) || '<$repoRoot_not_applicable>',
            worktreeRoot: currentWorktree?.directory || '<$worktreeRoot_not_applicable>',
            cwd: process.cwd(),
            // will be overwritten at a later point when a worktree is created
            newWorktreeRoot: currentWorktree?.directory || '<$newWorktreeRoot_not_applicable>',
            cliVersion: this.configService.config.version,
        }
    })
    get context() {
        return this.getContext()
    }

    updateContext(context: Partial<CliContext>) {
        Object.assign(this.context, context)
    }

    interpolateContextVars(contents: string) {
        const result = interpolateVariablesWithAllStrategies(
            contents,
            this.context,
            this.configService.config.interpolationStrategies,
        )

        return result.interpolated
    }

    private static instance: ContextService
    static init(...args: ConstructorParameters<typeof ContextService>) {
        if (this.instance) {
            Logger.warn(`${ContextService.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new ContextService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${ContextService.name} not initialized`)
        return this.instance
    }
}
