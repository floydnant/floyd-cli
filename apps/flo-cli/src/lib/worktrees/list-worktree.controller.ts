import path from 'path'
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
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        this.gitRepo.assertIsRepository(cwd)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const repoName = path.basename(this.gitRepo.getRepoRootDir(cwd)!)
        Logger.log(`Worktrees for ${repoName.blue}, sorted by HEAD ref date (oldest first):`)

        const worktrees = this.worktreeService
            .sortWorktreesByLastModified(this.gitRepo.getWorktrees(cwd))
            .map(worktree => {
                const worktreeStr = getWorktreeDisplayStr(worktree)

                const status = this.gitRepo.getGitStatus(worktree.directory)
                const statusDisplay = !status ? ' Clean'.dim : status

                const logLimit = isNaN(parseInt(opts.logs as string)) ? 5 : (opts.logs as unknown as number)
                const commits = opts.logs
                    ? '\n\n' + this.gitRepo.getCommitLogs(worktree.directory, logLimit)
                    : ''

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
