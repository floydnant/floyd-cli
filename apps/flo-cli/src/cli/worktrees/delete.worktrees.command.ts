import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { GitController } from '../../lib/git.controller'
import { ProjectsService } from '../../lib/projects/projects.service'
import { SysCallService } from '../../lib/sys-call.service'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { DeleteWorktreeController } from '../../lib/worktrees/delete-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'

export const deleteWorktreeCommand = new Command()
    .createCommand('delete')
    .alias('d')
    .description('Delete a worktree')
    .argument('[branch]', 'the branch related to the worktree')
    .option('-f, --force', 'force removal even if worktree is dirty or locked')
    .option('-d, --deleteBranch', 'delete the related branch')
    .option('-D, --forceDeleteBranch', 'force delete the related branch')
    .action(
        async (
            branch: string | undefined,
            options: { force?: boolean; deleteBranch?: boolean; forceDeleteBranch?: boolean },
        ) => {
            const gitRepo = GitRepository.getInstance()
            const configService = ConfigService.getInstance()
            const projectsService = ProjectsService.init(gitRepo, configService)
            const contextService = ContextService.getInstance()
            const workflowService = WorkflowService.init(configService, contextService)
            const controller = DeleteWorktreeController.init(
                WorktreeService.init(gitRepo, projectsService, workflowService),
                gitRepo,
                GitController.getInstance(),
                SysCallService.getInstance(),
            )

            await controller.deleteWorktree({ branch, ...options })
        },
    )
