import { GitRepository, Worktree } from '../../adapters/git'
import { ProjectsService } from '../projects/projects.service'
import { SysCallService } from '../sys-call.service'
import { cacheable } from '../utils'
import { Workflow } from '../workflows/workflow.schemas'
import { WorkflowService } from '../workflows/workflow.service'
import { WorktreeHook } from './worktree-config.schemas'

export type LastModifiedStats = {
    type: 'dirtyFiles' | 'folder' | 'head'
    latest: Date
    // files?: Record<string, Date | null>
    files?: (readonly [string, Date | null])[]
}

export class WorktreeService {
    /** Do not use this constructor directly, use `WorktreeService.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private projectsService: ProjectsService,
        private workflowService: WorkflowService,
        private sysCallService: SysCallService,
    ) {}

    // @TODO: this might rather belong into the projects service
    getWorktreeHook(hookId: WorktreeHook): Workflow | undefined {
        const currentProjectConfig = this.projectsService.getProject().config
        const workflowId = currentProjectConfig?.worktreeHooks?.[hookId]
        if (!workflowId) return

        return this.workflowService.getWorkflow(workflowId)
    }

    useFirstCleanWorktree(worktrees: Worktree[]): Worktree | null {
        const firstClean = worktrees.find(worktree => {
            const isDirty = !!this.gitRepo.getGitStatusString(worktree.directory)

            return !isDirty
        })
        return firstClean ?? null
    }

    getLastModified = cacheable(async (worktree: Worktree): Promise<LastModifiedStats> => {
        const dirtyFiles = await this.gitRepo.getDirtyFiles(worktree.directory)

        // If the working tree is dirty, use the last modified date of the files
        if (dirtyFiles.length > 0) {
            const result = await this.sysCallService.getLastModifiedFor(dirtyFiles)
            return { type: 'dirtyFiles', ...result }
        }

        // Head is not available for bare worktrees
        if (worktree.isBare) {
            const result = await this.sysCallService.getLastModified(worktree.directory)
            return { type: 'folder', latest: result }
        }

        // And the last commit/ref date otherwise (worktree is not bare, so we can use HEAD)
        return {
            type: 'head',
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            latest: await this.gitRepo.getDateOfRef(worktree.head!, worktree.directory),
        }
    })

    /**
     * Sort worktrees by last modified date
     * @param worktrees
     * @param direction `asc` = oldest first, `desc` = newest first
     */
    async sortWorktreesByLastModified(
        worktrees: Worktree[],
        direction: 'asc' | 'desc' = 'asc',
    ): Promise<
        (Worktree & {
            lastModified: Date
            modifiedStats: LastModifiedStats
        })[]
    > {
        const worktreesWithModfiedDate = await Promise.all(
            worktrees.map(async worktree => {
                const modifiedStats = await this.getLastModified(worktree)
                return {
                    ...worktree,
                    lastModified: modifiedStats.latest,
                    modifiedStats: modifiedStats,
                }
            }),
        )

        const sorterMap = {
            asc: (a: number, b: number) => a - b,
            desc: (a: number, b: number) => b - a,
        }

        return worktreesWithModfiedDate.sort((a, b) => {
            return sorterMap[direction](a.lastModified.valueOf(), b.lastModified.valueOf())
        })
    }

    async useOldestCleanWorktree(worktrees: Worktree[]): Promise<(Worktree & { lastModified: Date }) | null> {
        const sortedWorktrees = await this.sortWorktreesByLastModified(worktrees)
        const oldestClean = sortedWorktrees.find(worktree => {
            const isDirty = !!this.gitRepo.getGitStatusString(worktree.directory)
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
