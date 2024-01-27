import path from 'path'
import { GitRepository, Worktree, getNextWorktreeName } from '../../adapters/git'
import { NotAGitRepositoryException } from '../../adapters/git/git.errors'
import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { GithubRepository } from '../../adapters/github'

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
    const ghRepo = GithubRepository.getInstance()

    // @TODO: pass cwd as an option / get from context
    const cwd = process.cwd()
    const repoRootDir = gitRepo.getRepoRootDir(cwd)
    if (!repoRootDir) {
        throw new NotAGitRepositoryException()
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

    Logger.log(`\nCreating worktree in ${worktreePath.yellow}...`.dim)
    // @TODO: this must be a gitRepo operation
    sysCallService.execInherit(`git worktree add ${worktreePath} --quiet`)

    let worktreeBranch = worktreeName

    if (opts.branchToCheckout && opts.branchToCheckout != worktreeBranch) {
        gitRepo.gitCheckout(opts.branchToCheckout, worktreePath)
        worktreeBranch = opts.branchToCheckout

        gitRepo.deleteBranch(worktreeName)
    } else if (opts.pullRequestToCheckout && opts.pullRequestToCheckout != worktreeBranch) {
        ghRepo.assertInstalled()
        ghRepo.checkout(opts.pullRequestToCheckout, worktreePath)

        worktreeBranch = gitRepo.getCurrentBranch(worktreePath)

        gitRepo.deleteBranch(worktreeName)
    }

    return {
        branch: worktreeBranch,
        directory: worktreePath,
        isMainWorktree: false,
        isCurrent: false,
    }
}
