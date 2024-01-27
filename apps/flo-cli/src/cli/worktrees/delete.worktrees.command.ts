import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { GitService } from '../../lib/git.service'
import { ProjectsService } from '../../lib/projects/projects.service'
import { PromptController } from '../../lib/prompt.controller'
import { SysCallService } from '../../lib/sys-call.service'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { DeleteWorktreeController } from '../../lib/worktrees/delete-worktree.controller'
import { WorktreeController } from '../../lib/worktrees/worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { customErrorWriter } from '../../lib/logger.service'

export const deleteWorktreeCommand = new Command()
    .createCommand('delete')
    .configureOutput(customErrorWriter)
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
            const worktreeService = WorktreeService.init(
                gitRepo,
                projectsService,
                workflowService,
                SysCallService.getInstance(),
            )
            const controller = DeleteWorktreeController.init(
                worktreeService,
                gitRepo,
                WorktreeController.init(
                    gitRepo,
                    GitService.getInstance(),
                    worktreeService,
                    WorkflowController.init(
                        workflowService,
                        contextService,
                        SysCallService.getInstance(),
                        PromptController.getInstance(),
                    ),
                    PromptController.getInstance(),
                ),
                SysCallService.getInstance(),
            )

            await controller.deleteWorktree({ branch, ...options })
        },
    )
