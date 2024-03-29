import prompts from 'prompts'
import { GitRepository, getWorktreeFromBranch } from '../../adapters/git'
import { GitController } from '../git.controller'
import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { WorktreeService } from './worktree.service'

export class DeleteWorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private gitRepo: GitRepository,
        private gitController: GitController,
        private sysCallService: SysCallService,
    ) {}

    deleteWorktree = async (opts: {
        branch: string | undefined
        force?: boolean
        deleteBranch?: boolean
        forceDeleteBranch?: boolean
    }) => {
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        const worktrees = this.gitRepo.getWorktrees(cwd)
        const optsDelete = (opts.deleteBranch || opts.forceDeleteBranch) && { deleteBranch: true }

        if (opts.branch) {
            const worktree = getWorktreeFromBranch(opts.branch, worktrees)
            Logger.log()
            Logger.log(
                // @TODO: use basename highlighting here
                `Found worktree ${worktree.directory.green} for branch ${(worktree.branch || worktree.head)
                    ?.yellow}`.dim,
            )
            Logger.log()

            if (worktree.isMainWorktree) {
                throw new Error(`Cannot remove the main worktree in ${worktree.directory}`)
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

            // @TODO: this must be a gitRepo operation
            this.sysCallService.execInherit(
                `git worktree remove ${opts.force ? '--force' : ''} ${worktree.directory}`,
            )

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
                // @TODO: this must be a gitService operation
                this.gitRepo.deleteBranch(worktree.branch, opts.forceDeleteBranch)
            } catch (e) {
                Logger.debug(e)
                Logger.error(`Failed to delete branch ${opts.branch}`)
            }
            return
        }

        const removeableWorktrees = worktrees.filter(tree => !tree.isMainWorktree)
        if (!removeableWorktrees.length) {
            Logger.log('No worktrees to remove')
            return
        }

        const selectedTrees = await this.gitController.selectMultipleWorktrees('Select worktrees to remove', {
            worktrees: removeableWorktrees,
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
                message: `${'Delete'.red} ${
                    selectedTrees.length > 1 ? 'these branches' : 'this branch'
                } too?`,
            }))

        selectedTrees.forEach(tree => {
            console.log(`\nRemoving worktree ${tree.directory.yellow}...`.dim)

            // @TODO: this must be a gitRepo operation
            this.sysCallService.execInherit(
                `git worktree remove ${opts.force ? '--force' : ''} ${tree.directory}`,
            )

            if (deleteBranch && tree.branch) {
                // @TODO: this must be a gitService operation
                try {
                    this.gitRepo.deleteBranch(tree.branch, opts.forceDeleteBranch)
                } catch (e) {
                    Logger.error(`Failed to delete branch ${tree.branch}`, e)
                }
            }
        })
    }

    private static instance: DeleteWorktreeController
    static init(...args: ConstructorParameters<typeof DeleteWorktreeController>) {
        if (this.instance) {
            Logger.warn(`${DeleteWorktreeController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new DeleteWorktreeController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${DeleteWorktreeController.name} not initialized`)
        return this.instance
    }
}
