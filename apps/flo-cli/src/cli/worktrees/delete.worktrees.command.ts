import { Command } from 'commander'
import prompts from 'prompts'
import { GitRepository, getWorktreeFromBranch } from '../../adapters/git'
import { selectWorktrees } from '../../lib/worktrees/select-worktrees'
import { Logger } from '../../lib/logger.service'
import { SysCallService } from '../../lib/sys-call.service'

const deleteWorktree = async (
    branch: string | undefined,
    opts: { force?: boolean; deleteBranch?: boolean; forceDeleteBranch?: boolean },
) => {
    const gitRepo = GitRepository.getInstance()
    const sysCallService = SysCallService.getInstance()

    const worktrees = gitRepo.getWorktrees()
    const optsDelete = (opts.deleteBranch || opts.forceDeleteBranch) && { deleteBranch: true }

    if (branch) {
        const worktree = getWorktreeFromBranch(branch, worktrees)
        if (worktree.isMainWorktree) {
            console.log(`Cannot remove the main worktree in ${worktree.directory}`.red)
            process.exit(1)
        }

        const { confirmed } = await prompts({
            type: 'confirm',
            name: 'confirmed',
            message:
                'Remove'.red +
                ` the worktree in ${worktree.directory.yellow}${
                    worktree.branch ? ` with checked out branch ${worktree.branch.green}` : ''
                }?`,
        })
        if (!confirmed) return

        sysCallService.exec(`git worktree remove ${opts.force ? '--force' : ''} ${worktree.directory}`)

        if (!worktree.branch) return
        const { deleteBranch } =
            optsDelete ||
            (await prompts({
                type: 'confirm',
                name: 'deleteBranch',
                message: 'Delete'.red + ` the branch ${worktree.branch.green} too?`,
            }))
        if (!deleteBranch) return

        try {
            sysCallService.exec(`git branch ${opts.forceDeleteBranch ? '-D' : '-d'} ${worktree.branch}`)
        } catch (e) {
            Logger.debug(e)
            Logger.error(`Failed to delete branch ${branch}`)
        }
        return
    }

    const removeableWorktrees = worktrees.filter(tree => !tree.isMainWorktree)
    if (!removeableWorktrees.length) {
        console.log('No worktrees to remove')
        return
    }

    const selectedTrees = await selectWorktrees(removeableWorktrees, {
        message: 'Select worktrees to remove',
    })
    if (!selectedTrees?.length) return

    const { deleteBranch } =
        optsDelete ||
        (console.log(
            selectedTrees
                .map(tree => tree.branch && tree.branch.green)
                .filter(Boolean)
                .join('\n'),
        ),
        await prompts({
            type: 'confirm',
            name: 'deleteBranch',
            message: `${'Delete'.red} ${selectedTrees.length > 1 ? 'these branches' : 'this branch'} too?`,
        }))

    selectedTrees.forEach(tree => {
        console.log(`\nRemoving worktree ${tree.directory.yellow}...`.dim)

        sysCallService.exec(`git worktree remove ${opts.force ? '--force' : ''} ${tree.directory}`)

        if (deleteBranch && tree.branch) {
            try {
                sysCallService.exec(`git branch ${opts.forceDeleteBranch ? '-D' : '-d'} ${tree.branch}`)
            } catch (e) {
                Logger.debug(e)
                Logger.error(`Failed to delete branch ${tree.branch}`)
            }
        }
    })
}

export const deleteWorktreeCommand = new Command()
    .createCommand('delete')
    .alias('d')
    .description('Delete a worktree')
    .argument('[branch]', 'the branch related to the worktree')
    .option('-f, --force', 'force removal even if worktree is dirty or locked')
    .option('-d, --deleteBranch', 'delete the related branch')
    .option('-D, --forceDeleteBranch', 'force delete the related branch')
    .action(deleteWorktree)
