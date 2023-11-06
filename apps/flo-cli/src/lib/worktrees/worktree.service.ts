import { GitRepository, Worktree } from '../../adapters/git'
import { ProjectsService } from '../projects/projects.service'
import { cacheable } from '../utils'
import { Workflow } from '../workflows/workflow.schemas'
import { WorkflowService } from '../workflows/workflow.service'
import { WorktreeHook } from './worktree-config.schemas'

export class WorktreeService {
    /** Do not use this constructor directly, use `WorktreeService.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private projectsService: ProjectsService,
        private workflowService: WorkflowService,
    ) {}

    // @TODO: this might rather belong into the projects service
    getWorktreeHook(hookId: WorktreeHook): Workflow | undefined {
        const currentProjectConfig = this.projectsService.getProject().config
        const workflowId = currentProjectConfig?.worktreeHooks?.[hookId]
        if (!workflowId) return

        return this.workflowService.getWorkflow(workflowId)
    }

    useFirstCleanWorktree(worktrees = this.gitRepo.getWorktrees()): Worktree | null {
        const firstClean = worktrees.find(worktree => {
            const isDirty = !!this.gitRepo.getGitStatus(worktree.directory)

            return !isDirty
        })
        return firstClean ?? null
    }

    getLastModified = cacheable((dir?: string) => {
        const headHash = this.gitRepo.getHeadHash(dir)
        const refDate = this.gitRepo.getDateOfRef(headHash, dir)
        return refDate
    })

    sortWorktreesByLastModified(
        worktrees = this.gitRepo.getWorktrees(),
    ): (Worktree & { lastModified: Date })[] {
        const sortedWorktrees = worktrees
            .map(worktree => ({
                ...worktree,
                lastModified: this.getLastModified(worktree.directory),
            }))
            // sort by last modified, ascending (oldest first)
            .sort((a, b) => a.lastModified.valueOf() - b.lastModified.valueOf())

        return sortedWorktrees
    }

    useOldestCleanWorktree(
        worktrees = this.gitRepo.getWorktrees(),
    ): (Worktree & { lastModified: Date }) | null {
        const oldestClean = this.sortWorktreesByLastModified(worktrees).find(worktree => {
            const isDirty = !!this.gitRepo.getGitStatus(worktree.directory)
            return !isDirty
        })

        return oldestClean ?? null
    }

    private static instance: WorktreeService
    static init(...args: ConstructorParameters<typeof WorktreeService>) {
        this.instance = new WorktreeService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${WorktreeService.name} not initialized`)
        return this.instance
    }
}
