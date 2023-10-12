import path from 'path'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../config/config.service'
import { Logger } from '../logger.service'
import { Workflow } from '../workflows/workflow.schemas'
import { WorktreeHook } from './worktree-config.schemas'

export const getWorktreeHook = (hookId: WorktreeHook): Workflow | undefined => {
    const config = ConfigService.getInstance().config
    const repoRoot = GitRepository.getInstance().getRepoRootDir()
    if (!repoRoot) return

    const projectId = path.basename(repoRoot)
    const workflowId = config.projects?.[projectId]?.worktreeHooks?.[hookId]
    if (!workflowId) return

    const workflow = config.workflows?.find(flow => flow.workflowId == workflowId)
    if (workflow) return workflow

    Logger.getInstance().warn(`Could not find a workflow with ID ${workflowId}`)
}
