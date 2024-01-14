import '@total-typescript/ts-reset'
import path from 'path'
import { GitRepository, assertGitHubInstalled } from '../../adapters/git'
import { getOpenPullRequests, getPullRequest } from '../../adapters/github'
import { ContextService } from '../config/context.service'
import { GitController } from '../git.controller'
import { Logger } from '../logger.service'
import { OpenController } from '../open/open.controller'
import { WorkflowController } from '../workflows/workflow.controller'
import { selectPullRequest } from './select-pull-request'
import { setupWorktree } from './setup-worktree'
import { WorktreeHook } from './worktree-config.schemas'
import { WorktreeService } from './worktree.service'

export class CreateWorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private worktreeService: WorktreeService,
        private gitRepo: GitRepository,
        private gitController: GitController,
        private contextService: ContextService,
        private openController: OpenController,
        private workflowController: WorkflowController,
    ) {}

    createWorktree = async (opts: {
        branch: string | undefined
        upstreamBranch?: boolean | string
        remote?: string
        pullRequest?: boolean | string
        subDir?: string
        directory?: string
        useBranch: boolean
        /** wether to stick the name of the repo in front of the new worktree's directory */
        worktreePrefix: boolean
        skipHooks: boolean
    }) => {
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        const worktrees = this.gitRepo.getWorktrees(cwd)
        const useRemoteBranches = !!opts.upstreamBranch || !!opts.pullRequest
        // @TODO: we need to look for remote branches differently
        // const branches = this.gitRepo.getBranches(useRemoteBranches)

        let branch = typeof opts.upstreamBranch == 'string' ? opts.upstreamBranch : opts.branch

        pullRequestsScope: if (opts.pullRequest) {
            assertGitHubInstalled()

            if (typeof opts.pullRequest == 'boolean') {
                const pullRequest = await selectPullRequest(worktrees, getOpenPullRequests())
                if (!pullRequest) process.exit(1)

                branch = pullRequest.headRefName
                break pullRequestsScope
            }

            const pr = getPullRequest(opts.pullRequest)
            branch = pr.headRefName
            Logger.verbose(`\nFound pull request ${('#' + pr.number).magenta} ${pr.title}`.dim)
        }

        // eslint-disable-next-line no-unused-labels
        branchingScope: if (!branch) {
            const branchSelection = await this.gitController.selectBranch({
                message: `Select a${useRemoteBranches ? ' remote' : ''} branch to create a worktree from`,
                allowNewBranch: !useRemoteBranches,
            })

            if (!branchSelection) {
                Logger.warn('No branch selected'.red)
                process.exit(1)
            }

            branch = branchSelection.branch
            if (branchSelection.isNew) this.gitRepo.createBranch(branch)
        }
        if (!branch) return

        const checkedOutWorktree = worktrees.find(worktree => worktree.branch == branch)
        if (checkedOutWorktree) {
            Logger.error(
                `The branch ${branch.yellow} is already checked out in `.red +
                    checkedOutWorktree.directory.green,
            )
            process.exit(1)
        }

        // const upstream = !useRemoteBranches ? '' : (opts.remote || getRemoteOf(branch) || 'origin') + ' ' + branch

        // @TODO: this doesn't work, refactor this to the new approach
        if (useRemoteBranches) this.gitRepo.gitFetch()
        // create branch if it doesn't exist yet
        else if (!this.gitRepo.getBranches().includes(branch)) {
            Logger.log(`\nBranch ${branch.yellow} does not exists yet, creating it for you now...`.dim)
            this.gitRepo.createBranch(branch, null)
        }

        const worktree = setupWorktree({
            ...opts,
            existingWorktrees: worktrees,
            worktreeName: opts.useBranch ? branch : undefined,
            branchToCheckout: branch,
        })

        if (!opts.skipHooks) {
            const workflowOnCreate = this.worktreeService.getWorktreeHook(WorktreeHook.OnCreate)
            if (workflowOnCreate) {
                Logger.log(`Running workflow hook ${WorktreeHook.OnCreate.cyan}...`)
                await this.workflowController.runWorkflow(workflowOnCreate, {
                    newWorktreeRoot: worktree.directory,
                })
            }

            const workflowBeforeOpen = this.worktreeService.getWorktreeHook(WorktreeHook.BeforeOpen)
            if (workflowBeforeOpen) {
                Logger.log(`Running workflow hook ${WorktreeHook.BeforeOpen.cyan}...`)
                await this.workflowController.runWorkflow(workflowBeforeOpen, {
                    newWorktreeRoot: worktree.directory,
                })
            }
        }

        Logger.log()
        const folderPath = path.join(worktree.directory, opts.subDir || '')
        await this.openController.openFolder(folderPath, {
            subject: 'worktree',
            message: 'Your worktree is ready! What next?',
            noopTitle: 'Do nothing',
        })
    }

    private static instance: CreateWorktreeController
    static init(...args: ConstructorParameters<typeof CreateWorktreeController>) {
        if (this.instance) {
            Logger.warn(`${CreateWorktreeController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new CreateWorktreeController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${CreateWorktreeController.name} not initialized`)
        return this.instance
    }
}
