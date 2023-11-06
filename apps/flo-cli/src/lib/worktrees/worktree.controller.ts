import { GitRepository, Worktree } from '../../adapters/git'
import { GitExceptionCode, matchGitError } from '../../adapters/git/git.errors'
import { GitService } from '../git.service'
import { Logger } from '../logger.service'
import { PromptController } from '../prompt.controller'
import { getRelativePathOf } from '../utils'
import { WorkflowController } from '../workflows/workflow.controller'
import { WorktreeService } from './worktree.service'

export type ChooseOrCreateWorktreeResult = {
    worktree: Worktree
    isBranchNew: boolean
    isWorktreeNew: boolean
}

export class WorktreeController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private gitService: GitService,
        private worktreeService: WorktreeService,
        private workflowController: WorkflowController,
        private promptController: PromptController,
    ) {}

    async chooseOrCreateWorktree(
        branch: string,
        options?: { allowNewBranch?: boolean },
    ): Promise<ChooseOrCreateWorktreeResult | null> {
        const allowNewBranch = options?.allowNewBranch ?? true

        // @TODO: worktree selection strategy should be configurable
        const worktree = this.worktreeService.useOldestCleanWorktree()
        if (worktree) {
            let isBranchNew = false
            try {
                const output = this.gitRepo.gitCheckout(branch, worktree.directory)
                Logger.verbose(output)
            } catch (e) {
                if (matchGitError(e)?.code != GitExceptionCode.PATHSPEC_DID_NOT_MATCH_ANY_FILES) throw e

                if (!allowNewBranch) {
                    Logger.log(`Branch ${branch.yellow} does not exist, aborting`)
                    return null
                }

                // @TODO: prompt for the baseBranch
                const baseBranch = this.gitRepo.getCurrentBranch()
                const createBranch = await this.promptController.confirm(
                    `Branch ${branch.yellow} does not exist locally nor remotely, create it? (branching off of ${baseBranch.yellow})`,
                )
                if (!createBranch) {
                    Logger.log('Aborting')
                    return null
                }

                isBranchNew = true
                this.gitService.createBranch(branch)
                const output = this.gitRepo.gitCheckout(branch, worktree.directory)
                Logger.verbose(output)
            }

            Logger.log(
                `Reusing worktree at ${getRelativePathOf(worktree.directory).green} for ${branch.yellow}`,
            )

            return {
                worktree,
                isBranchNew,
                isWorktreeNew: false,
            }
        }

        Logger.log('All worktrees are dirty')

        const result = await this.createWorktree(branch, { allowNewBranch })
        if (!result) return null

        return {
            worktree: result.worktree,
            isBranchNew: result.isBranchNew,
            isWorktreeNew: true,
        }
    }

    async createWorktree(branch: string, options?: { allowNewBranch?: boolean }) {
        const allowNewBranch = options?.allowNewBranch ?? true

        let worktree: Worktree
        let isBranchNew = false
        try {
            worktree = this.gitService.createWorktree({ branch })
        } catch (e) {
            if (matchGitError(e)?.code != GitExceptionCode.INVALID_REFERENCE) throw e

            if (!allowNewBranch) {
                Logger.log(`Branch ${branch.yellow} does not exist, aborting`)
                return null
            }

            // @TODO: prompt for the baseBranch
            const baseBranch = this.gitRepo.getCurrentBranch()
            const createBranch = await this.promptController.confirm(
                `Branch ${branch.yellow} does not exist locally nor remotely, create it? (branching off of ${baseBranch.yellow})`,
            )
            if (!createBranch) {
                Logger.log('Aborting')
                return null
            }

            isBranchNew = true
            this.gitService.createBranch(branch)
            worktree = this.gitService.createWorktree({ branch })
        }

        return { worktree, isBranchNew }
    }

    private static instance: WorktreeController
    static init(...args: ConstructorParameters<typeof WorktreeController>) {
        if (this.instance) {
            Logger.warn(`${WorktreeController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new WorktreeController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${WorktreeController.name} not initialized`)
        return this.instance
    }
}
