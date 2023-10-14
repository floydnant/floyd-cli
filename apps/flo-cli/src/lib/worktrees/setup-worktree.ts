import path from 'path'
import { GitRepository, Worktree, assertGitHubInstalled, getNextWorktreeName } from '../../adapters/git'
import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'

export const setupWorktree = (opts: {
    worktreePrefix: boolean
    worktreeName?: string
    /** If a directory is given, the `worktreeName` is ignored. */
    directory?: string
    branchToCheckout?: string
    pullRequestToCheckout?: string
    existingWorktrees: Worktree[]
}): Worktree => {
    const gitRepo = GitRepository.getInstance()
    const sysCallService = SysCallService.getInstance()

    const repoRootDir = gitRepo.getRepoRootDir()
    if (!repoRootDir) {
        Logger.getInstance().error('Not in a git repository')
        process.exit(1)
    }
    const repoFolderName = path.basename(repoRootDir)

    const getWorktreeName = () => {
        const prefix = opts.worktreePrefix ? repoFolderName + '.' : ''
        return `${prefix}${
            opts.worktreeName
                ? opts.worktreeName?.replace(/\//g, '-')
                : getNextWorktreeName(opts.existingWorktrees)
        }`
    }

    const worktreeName = opts.directory ? path.basename(opts.directory) : getWorktreeName()
    const worktreePath =
        opts.directory || path.join(repoRootDir, '../', repoFolderName + '.worktrees/', worktreeName)

    Logger.getInstance().log(`\nCreating worktree in ${worktreePath.yellow}...`.dim)
    sysCallService.exec(`git worktree add ${worktreePath} --quiet`)

    let worktreeBranch = worktreeName

    if (opts.branchToCheckout && opts.branchToCheckout != worktreeBranch) {
        gitRepo.gitCheckout(opts.branchToCheckout, worktreePath)
        worktreeBranch = opts.branchToCheckout

        gitRepo.deleteBranch(worktreeName, null)
    } else if (opts.pullRequestToCheckout && opts.pullRequestToCheckout != worktreeBranch) {
        assertGitHubInstalled()

        sysCallService.exec(`gh pr checkout ${opts.pullRequestToCheckout}`, { cwd: worktreePath })
        worktreeBranch = gitRepo.getCurrentBranch(worktreePath)

        gitRepo.deleteBranch(worktreeName, null)
    }

    return {
        branch: worktreeBranch,
        directory: worktreePath,
        isMainWorktree: false,
        isCurrent: false,
    }
}
