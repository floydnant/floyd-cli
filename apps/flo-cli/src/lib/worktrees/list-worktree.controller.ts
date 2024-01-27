import path from 'path'
import { GitRepository } from '../../adapters/git'
import { Logger } from '../logger.service'
import { getWorktreeSections } from '../worktree.formatting'
import { WorktreeService } from './worktree.service'

export class ListWorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private gitRepo: GitRepository,
    ) {}

    async listWorktrees(opts: { logs?: boolean | string }) {
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        this.gitRepo.assertIsRepository(cwd)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const repoName = path.basename(this.gitRepo.getRepoRootDir(cwd)!)
        Logger.log(
            `Worktrees for ${repoName.blue}, sorted by HEAD ref date or dirty files' last modification (oldest first), git status also sorted by files' modification:`,
        )

        const worktrees = await this.worktreeService.sortWorktreesByLastModified(
            this.gitRepo.getWorktrees(cwd),
        )
        const worktreesWithIsDirty = await Promise.all(
            worktrees.map(async worktree => {
                const gitStatus = await this.gitRepo.getGitStatusString(worktree.directory)

                const logLimit = isNaN(parseInt(opts.logs as string)) ? 5 : (opts.logs as unknown as number)
                const commits = opts.logs
                    ? '\n\n' + (await this.gitRepo.getCommitLogs(worktree.directory, logLimit))
                    : ''

                return {
                    ...worktree,
                    isDirty: !!gitStatus,
                    gitStatus,
                    commitLog: commits,
                }
            }),
        )
        const worktreeSections = getWorktreeSections(worktreesWithIsDirty)

        const output = worktreeSections.map(({ section }) => section).join('\n')

        // @TODO: make this configurable (via config file)
        output.split('\n').forEach((line, i) => setTimeout(Logger.log, i * 2, line))
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
