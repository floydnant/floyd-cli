import path from 'path'
import {
    Worktree,
    getRepoRootDir,
    getNextWorktreeName,
    deleteBranch,
    gitCheckout,
    getCurrentBranch,
} from '../../../adapters/git'
import { Logger } from '../../../lib/logger.service'
import { assertGitHubInstalled, exec } from '../../../lib/utils'

export const setupWorktree = (opts: {
    worktreePrefix: boolean
    worktreeName?: string
    /** If a directory is given, the `worktreeName` is ignored. */
    directory?: string
    branchToCheckout?: string
    pullRequestToCheckout?: string
    existingWorktrees: Worktree[]
}): Worktree => {
    const repoRootDir = getRepoRootDir()
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
    exec(`git worktree add ${worktreePath} --quiet`)

    let worktreeBranch = worktreeName

    if (opts.branchToCheckout && opts.branchToCheckout != worktreeBranch) {
        gitCheckout(opts.branchToCheckout, worktreePath)
        worktreeBranch = opts.branchToCheckout

        deleteBranch(worktreeName, null)
    } else if (opts.pullRequestToCheckout && opts.pullRequestToCheckout != worktreeBranch) {
        assertGitHubInstalled()

        exec(`gh pr checkout ${opts.pullRequestToCheckout}`, worktreePath)
        worktreeBranch = getCurrentBranch(worktreePath)

        deleteBranch(worktreeName, null)
    }

    return {
        branch: worktreeBranch,
        dir: worktreePath,
        isMainWorktree: false,
        isCurrent: false,
    }
}
