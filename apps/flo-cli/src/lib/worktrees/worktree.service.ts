import { GitRepository } from '../../adapters/git'
import { ProjectsService } from '../projects/projects.service'
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
