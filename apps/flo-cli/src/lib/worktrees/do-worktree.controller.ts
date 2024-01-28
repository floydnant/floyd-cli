import { GitRepository, fixBranchName } from '../../adapters/git'
import { GithubRepository } from '../../adapters/github'
import { AppOptionArg, ReuseWindowOptionArg, SkipHooksOptionArg } from '../../cli/shared.options'
import { GitController } from '../git.controller'
import { GitService } from '../git.service'
import { Logger } from '../logger.service'
import { OpenController } from '../open/open.controller'
import { PromptController } from '../prompt.controller'
import { isHttpUrl, isNumber } from '../type-guards'
import { getRelativePathOf } from '../utils'
import { WorkflowController } from '../workflows/workflow.controller'
import { WorktreeHook } from './worktree-config.schemas'
import { ChooseOrCreateWorktreeResult, WorktreeController } from './worktree.controller'
import { WorktreeService } from './worktree.service'

export class DoWorkorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private worktreeController: WorktreeController,
        private workflowController: WorkflowController,
        private openController: OpenController,
        private gitRepo: GitRepository,
        private gitService: GitService,
        private gitController: GitController,
        private promptController: PromptController,
        private ghRepo: GithubRepository,
    ) {}

    async do(
        options: { input: string; baseBranch?: string; newBranch: boolean } & SkipHooksOptionArg &
            ReuseWindowOptionArg &
            AppOptionArg,
    ) {
        // @TODO: if there's no input what shoudld we do?
        if (!options.input) {
            Logger.error('Not implemented yet')

            return
        }

        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()

        const input = options.input.replace(/#(?=\d+)/, '') // remove '#' from '#123'
        let branch = input

        if (options.newBranch || options.baseBranch) {
            this.gitService.createBranch(branch, options.baseBranch)

            const result = await this.worktreeController.chooseOrCreateWorktree(branch, {
                allowNewBranch: false, // branch should already exist
            })
            if (!result) return // aborted - message already logged

            await this.runWorkflowsAndOpenWorktree(result, options)
            return
        }

        // if input is a number or url => fetch pr and use headref
        if (isNumber(branch) || isHttpUrl(branch)) {
            Logger.log(`Looking for pull request...`)

            // @TODO: we need some proper error handling around this
            const pr = this.ghRepo.getPullRequest(input)
            Logger.log(`Found ${('#' + pr.number).magenta} ${pr.title}`)

            branch = pr.headRefName
        }

        const localBranches = this.gitRepo.getBranches()
        const worktrees = this.gitRepo.getWorktrees(cwd)

        // check if branch exists locally
        if (localBranches.includes(branch)) {
            const worktree = worktrees.find(tree => {
                return tree.branch == branch || tree.branch == fixBranchName(branch)
            })

            // if there is a worktree for it => open it
            if (worktree) {
                Logger.log(
                    `${branch.yellow} is checked out at ${getRelativePathOf(worktree.directory).green}`,
                )

                // run worktree hook `beforeOpen`
                if (!options.skipHooks) {
                    const beforeOpenWorkflow = this.worktreeService.getWorktreeHook(WorktreeHook.BeforeOpen)
                    if (beforeOpenWorkflow)
                        await this.workflowController.runWorkflow(beforeOpenWorkflow, {
                            newWorktreeRoot: worktree.directory,
                        })
                }

                await this.openController.openFolder(worktree.directory, {
                    subject: 'worktree',
                    ...options,
                })
                return
            }

            const result = await this.worktreeController.chooseOrCreateWorktree(branch, {
                allowNewBranch: false, // branch should already exist
            })
            if (!result) return // aborted - message already logged

            await this.runWorkflowsAndOpenWorktree(result, options)
            return
        }

        this.gitRepo.gitFetch()

        const result = await this.worktreeController.chooseOrCreateWorktree(branch)
        if (!result) return // aborted - message already logged

        await this.runWorkflowsAndOpenWorktree(result, options)
    }

    private async runWorkflowsAndOpenWorktree(
        result: ChooseOrCreateWorktreeResult,
        options: SkipHooksOptionArg & ReuseWindowOptionArg,
    ) {
        const worktree = result.worktree

        const workflowContext = {
            newWorktreeRoot: worktree.directory,
        }
        const openFolderOptions = {
            subject: 'worktree',
            ...options,
        }

        if (options.skipHooks) {
            await this.openController.openFolder(worktree.directory, openFolderOptions)
            return
        }

        // if we're not reusing the window, we can open a new one right away, before running the hooks (saves some waiting time)
        if (!options.reuseWindow) {
            // run worktree hook `beforeOpen`
            if (!options.skipHooks) {
                const beforeOpenWorkflow = this.worktreeService.getWorktreeHook(WorktreeHook.BeforeOpen)
                if (beforeOpenWorkflow)
                    await this.workflowController.runWorkflow(beforeOpenWorkflow, workflowContext)
            }

            await this.openController.openFolder(worktree.directory, openFolderOptions)
        }

        // run worktree hook `onCreate` or `onCheckout`
        if (!options.skipHooks) {
            const workflow = this.worktreeService.getWorktreeHook(
                result?.isWorktreeNew ? WorktreeHook.OnCreate : WorktreeHook.OnCheckout,
            )
            if (workflow) await this.workflowController.runWorkflow(workflow, workflowContext)
        }

        // this step is only required if we're reusing the window, since the worktree would have been opened already otherwise
        if (options.reuseWindow) {
            // run worktree hook `beforeOpen`
            if (!options.skipHooks) {
                const beforeOpenWorkflow = this.worktreeService.getWorktreeHook(WorktreeHook.BeforeOpen)
                if (beforeOpenWorkflow)
                    await this.workflowController.runWorkflow(beforeOpenWorkflow, workflowContext)
            }

            await this.openController.openFolder(worktree.directory, openFolderOptions)
        }
    }

    private static instance: DoWorkorktreeController
    static init(...args: ConstructorParameters<typeof DoWorkorktreeController>) {
        if (this.instance) {
            Logger.warn(`${DoWorkorktreeController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new DoWorkorktreeController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${DoWorkorktreeController.name} not initialized`)
        return this.instance
    }
}
