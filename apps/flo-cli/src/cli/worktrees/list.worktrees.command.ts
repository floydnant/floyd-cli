import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ListWorktreeController } from '../../lib/worktrees/list-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { ProjectsService } from '../../lib/projects/projects.service'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { ContextService } from '../../lib/config/context.service'
import { SysCallService } from '../../lib/sys-call.service'
import { customErrorWriter } from '../../lib/logger.service'

export const listWorktreesCommand = new Command()
    .createCommand('list')
    .configureOutput(customErrorWriter)
    .alias('ls')
    .description('List worktrees')
    .option('-l, --logs [number]', 'Show recent commit logs')
    .action(async (opts: { logs?: boolean | string }) => {
        const gitRepo = GitRepository.getInstance()
        const configService = ConfigService.getInstance()
        const projectsService = ProjectsService.init(gitRepo, configService)
        const contextService = ContextService.getInstance()
        const workflowService = WorkflowService.init(configService, contextService)
        const controller = ListWorktreeController.init(
            WorktreeService.init(gitRepo, projectsService, workflowService, SysCallService.getInstance()),
            gitRepo,
        )

        await controller.listWorktrees(opts)
    })
