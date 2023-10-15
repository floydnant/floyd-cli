import path from 'path'
import { GitRepository, getWorktreeFromBranch } from '../../adapters/git'
import { ContextService } from '../config/context.service'
import { OpenController } from '../open/open.controller'
import { resolveWorkflow } from '../workflows/resolve-workflow'
import { runWorkflow } from '../workflows/run-workflow'
import { selectWorktrees } from './select-worktrees'
import { WorktreeHook } from './worktree-config.schemas'
import { WorktreeService } from './worktree.service'

export class OpenWorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private gitRepo: GitRepository,
        private contextService: ContextService,
        private openController: OpenController,
    ) {}

    // @TODO: @floydnant we should be able to checkout a new branch/PR from here with a --checkout <branchOrPrNumber> flag
    openWorktree = async (opts: { branch: string | undefined; reuseWindow?: boolean; subDir?: string }) => {
        const worktrees = this.gitRepo.getWorktrees()
        const workflow = this.worktreeService.getWorktreeHook(WorktreeHook.OnSwitch)
        const openOpts = { reuseWindow: opts.reuseWindow }

        if (opts.branch) {
            const worktree = getWorktreeFromBranch(opts.branch, worktrees)
            const folderPath = path.join(worktree.directory, opts.subDir || '')

            if (workflow) {
                this.contextService.context.newWorktreeRoot = worktree.directory
                await runWorkflow(resolveWorkflow(workflow))
            }

            this.openController.openFolder(folderPath, openOpts)
            return
        }

        const selectedWorktrees = await selectWorktrees(worktrees, { multiple: false })
        if (!selectedWorktrees?.length) return
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const worktree = selectedWorktrees[0]!

        if (workflow) {
            this.contextService.context.newWorktreeRoot = worktree.directory
            await runWorkflow(resolveWorkflow(workflow))
        }

        const folderPath = path.join(worktree.directory, opts.subDir || '')
        this.openController.openFolder(folderPath, openOpts)
    }

    private static instance: OpenWorktreeController
    static init(...args: ConstructorParameters<typeof OpenWorktreeController>) {
        this.instance = new OpenWorktreeController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${OpenWorktreeController.name} not initialized`)
        return this.instance
    }
}
