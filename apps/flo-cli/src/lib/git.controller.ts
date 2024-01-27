import { GitRepository, Worktree, getBranchWorktreeString, getWorktreeDisplayStr } from '../adapters/git'
import { GitService } from './git.service'
import { Logger } from './logger.service'
import { PromptController } from './prompt.controller'

export class GitController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private gitService: GitService,
        private promptController: PromptController,
    ) {}

    async selectBranch({
        message,
        allowNewBranch = true,
        allowCheckedOutBranches = false,
    }: {
        message: string
        allowNewBranch?: boolean
        allowCheckedOutBranches?: boolean
    }): Promise<{ branch: string; isNew: boolean } | null> {
        const branches = this.gitRepo.getBranches()
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        const worktrees = this.gitRepo.getWorktrees(cwd)

        selectionScope: {
            // If there are no branches (which is impossible btw) and we're not allowed to create new ones, we don't need to ask the user
            if (branches.length == 0) {
                if (allowNewBranch) break selectionScope

                return null
            }
            // If there is only one branch (must be the default branch), we don't need to ask the user
            if (branches.length == 1 && !allowNewBranch) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                if (allowCheckedOutBranches) return { branch: branches[0]!, isNew: false }

                return null
            }

            const newBranchChoice = '*new*'
            const selected = await this.promptController.select({
                message,
                choices: [
                    allowNewBranch && { title: '** Create new branch **'.green, value: newBranchChoice },
                    ...branches.map(branch => {
                        const checkedOutWorktreeString = getBranchWorktreeString(worktrees, branch)

                        return {
                            title: `${branch}${checkedOutWorktreeString}`,
                            value: branch,
                            disabled: allowCheckedOutBranches ? false : !!checkedOutWorktreeString,
                        }
                    }),
                ],
            })
            if (!selected) return null

            if (selected != newBranchChoice) return { branch: selected, isNew: false }
        }

        const currentBranch = this.gitRepo.getCurrentBranch()
        const newBranch = await this.promptController.input(
            `Enter a new branch name (branch off of ${currentBranch.yellow})`,
            {
                validate: newBranch => (branches.includes(newBranch) ? 'Branch already exists' : true),
            },
        )
        if (!newBranch) return null

        return { branch: newBranch, isNew: true }
    }

    private getWorktreeChoices(worktrees?: Worktree[]) {
        // @TODO: pass cwd as an option / get from context
        const cwd = process.cwd()
        worktrees ??= this.gitRepo.getWorktrees(cwd)

        return worktrees.map(worktree => {
            const isDirty = !!this.gitRepo.getGitStatus(worktree.directory)
            return {
                title: getWorktreeDisplayStr(worktree, isDirty),
                value: worktree,
            }
        })
    }
    async selectWorktree(
        message: string,
        options?: {
            worktrees?: Worktree[]
        },
    ): Promise<Worktree | null> {
        const choices = this.getWorktreeChoices(options?.worktrees)
        if (!choices.length) return null

        const selectedWorktree = await this.promptController.select({
            message,
            choices,
        })

        if (!selectedWorktree) {
            Logger.log('No worktree selected')
            return null
        }
        return selectedWorktree
    }
    async selectMultipleWorktrees(
        message: string,
        options?: {
            worktrees?: Worktree[]
        },
    ): Promise<Worktree[] | null> {
        const choices = this.getWorktreeChoices(options?.worktrees)
        if (!choices.length) return null

        const selectedWorktrees = await this.promptController.selectMultiple({
            message,
            choices,
        })

        if (!selectedWorktrees?.length) {
            Logger.log('No worktrees selected')
            return null
        }
        return selectedWorktrees
    }

    private static instance: GitController
    static init(...args: ConstructorParameters<typeof GitController>) {
        if (this.instance) {
            Logger.warn(`${GitController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new GitController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${GitController.name} not initialized`)
        return this.instance
    }
}
