import { GitRepository, getWorktreeDisplayStr } from '../../adapters/git'
import { Logger } from '../logger.service'
import { getPaddedStr, indent } from '../utils'
import { WorktreeService } from './worktree.service'

export class ListWorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private gitRepo: GitRepository,
    ) {}

    listWorktrees(opts: { logs?: boolean | string }) {
        const worktrees = this.gitRepo
            .getWorktrees()
            .map(tree => {
                const worktreeStr = getWorktreeDisplayStr(tree)

                const status = this.gitRepo.getGitStatus(tree.directory)
                const statusDisplay = !status ? ' Clean'.dim : status

                const logLimit = isNaN(parseInt(opts.logs as string)) ? 5 : (opts.logs as unknown as number)
                const commits = opts.logs ? '\n\n' + this.gitRepo.getCommitLogs(tree.directory, logLimit) : ''

                return `${getPaddedStr(worktreeStr)}\n${indent(statusDisplay, 3)}${indent(commits)}`
            })
            .join('\n\n')
        Logger.log('\n' + worktrees + '\n')
    }

    private static instance: ListWorktreeController
    static init(...args: ConstructorParameters<typeof ListWorktreeController>) {
        this.instance = new ListWorktreeController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${ListWorktreeController.name} not initialized`)
        return this.instance
    }
}
