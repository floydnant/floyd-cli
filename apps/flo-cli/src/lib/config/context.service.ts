import { interpolateVariables } from '@flo/common'
import { GitRepository } from '../../adapters/git'
import { Logger } from '../logger.service'
import { globalPaths } from './config.vars'
import { cacheable } from '../utils'

export class ContextService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private gitRepo: GitRepository) {}

    private getContext = cacheable(() => {
        const currentWorktree = this.gitRepo.getCurrentWorktree()
        return {
            ...globalPaths,
            // localConfigRoot: localConfigFolder, // @TODO: @floydnant
            repoRoot: this.gitRepo.getRepoRootDir() || '<$repoRoot_not_applicable>',
            worktreeRoot: currentWorktree?.directory || '<$worktreeRoot_not_applicable>',
            cwd: process.cwd(),
            // will be overwritten at a later point when a worktree is created
            newWorktreeRoot: currentWorktree?.directory || '<$newWorktreeRoot_not_applicable>',
        }
    })
    get context() {
        return this.getContext()
    }

    interpolateContextVars(contents: string) {
        const contextVariables = this.context
        const interpolated = interpolateVariables(contents, contextVariables)

        return interpolated
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
