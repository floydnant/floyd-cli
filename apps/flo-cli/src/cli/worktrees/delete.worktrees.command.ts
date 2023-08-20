import { Command } from 'commander'
import prompts from 'prompts'
import { getWorktreeFromBranch, getWorktrees } from '../../adapters/git'
import { exec } from '../../lib/utils'
import { selectWorktrees } from './lib/select-worktrees'
import { Logger } from '../../lib/logger.service'

const deleteWorktree = async (
    branch: string | undefined,
    opts: { force?: boolean; deleteBranch?: boolean; forceDeleteBranch?: boolean },
) => {
    const worktrees = getWorktrees()
    const optsDelete = (opts.deleteBranch || opts.forceDeleteBranch) && { deleteBranch: true }
    const logger = Logger.getInstance()

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

        exec(`git worktree remove ${opts.force ? '--force' : ''} ${worktree.directory}`)

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
            exec(`git branch ${opts.forceDeleteBranch ? '-D' : '-d'} ${worktree.branch}`)
        } catch (e) {
            logger.debug(e)
            logger.error(`Failed to delete branch ${branch}`)
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

        exec(`git worktree remove ${opts.force ? '--force' : ''} ${tree.directory}`)

        if (deleteBranch && tree.branch) {
            try {
                exec(`git branch ${opts.forceDeleteBranch ? '-D' : '-d'} ${tree.branch}`)
            } catch (e) {
                logger.debug(e)
                logger.error(`Failed to delete branch ${tree.branch}`)
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
