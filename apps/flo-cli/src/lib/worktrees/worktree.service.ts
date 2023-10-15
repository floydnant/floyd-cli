import path from 'path'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../config/config.service'
import { Logger } from '../logger.service'
import { Workflow } from '../workflows/workflow.schemas'
import { WorktreeHook } from './worktree-config.schemas'

export class WorktreeService {
    /** Do not use this constructor directly, use `WorktreeService.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private configService: ConfigService,
    ) {}

    getWorktreeHook(hookId: WorktreeHook): Workflow | undefined {
        const config = this.configService.config
        const repoRoot = this.gitRepo.getRepoRootDir()
        if (!repoRoot) return

        const projectId = path.basename(repoRoot)
        const workflowId = config.projects?.[projectId]?.worktreeHooks?.[hookId]
        if (!workflowId) return

        const workflow = config.workflows?.find(flow => flow.workflowId == workflowId)
        if (workflow) return workflow

        Logger.getInstance().warn(`Could not find a workflow with ID ${workflowId}`)
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
