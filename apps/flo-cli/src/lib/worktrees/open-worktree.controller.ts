import path from 'path'
import { GitRepository, getWorktreeFromBranch } from '../../adapters/git'
import { ContextService } from '../config/context.service'
import { GitController } from '../git.controller'
import { OpenController, OpenOptions } from '../open/open.controller'
import { WorkflowController } from '../workflows/workflow.controller'
import { WorktreeHook } from './worktree-config.schemas'
import { WorktreeService } from './worktree.service'
import { AppOptionArg, ReuseWindowOptionArg, WaitForCloseOptionArg } from '../../cli/shared.options'
import { WorktreeController } from './worktree.controller'
import { Logger } from '../logger.service'

export class OpenWorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private gitRepo: GitRepository,
        private gitController: GitController,
        private contextService: ContextService,
        private openController: OpenController,
        private workflowController: WorkflowController,
        private worktreeController: WorktreeController,
    ) {}

    // @TODO: @floydnant we should be able to checkout a new branch/PR from here with a --checkout <branchOrPrNumber> flag
    openWorktree = async (
        opts: { branch: string | undefined; subDir?: string } & Partial<
            ReuseWindowOptionArg & AppOptionArg & WaitForCloseOptionArg
        >,
    ) => {
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        const worktrees = this.gitRepo.getWorktrees(cwd)
        const workflow = this.worktreeService.getWorktreeHook(WorktreeHook.BeforeOpen)
        const openOpts: OpenOptions = {
            reuseWindow: opts.reuseWindow,
            waitForClose: opts.waitForClose,
            app: opts.app,
            subject: 'worktree',
        }

        if (opts.branch) {
            const worktree = getWorktreeFromBranch(opts.branch, worktrees)
            Logger.log()
            Logger.log(
                // @TODO: use basename highlighting here
                `Found worktree ${worktree.directory.green} for branch ${(worktree.branch || worktree.head)
                    ?.yellow}`.dim,
            )
            Logger.log()

            const folderPath = path.join(worktree.directory, opts.subDir || '')

            if (workflow) {
                await this.workflowController.runWorkflow(workflow, { newWorktreeRoot: worktree.directory })
            }

            this.openController.openFolder(folderPath, openOpts)
            return
        }

        const worktree = await this.worktreeController.selectWorktree('Select a worktree to open')
        if (!worktree) return

        if (workflow) {
            await this.workflowController.runWorkflow(workflow, { newWorktreeRoot: worktree.directory })
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
