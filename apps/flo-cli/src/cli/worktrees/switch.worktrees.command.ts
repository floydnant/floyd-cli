import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { GitController } from '../../lib/git.controller'
import { OpenController } from '../../lib/open/open.controller'
import { OpenWorktreeController } from '../../lib/worktrees/open-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { ProjectsService } from '../../lib/projects/projects.service'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { SysCallService } from '../../lib/sys-call.service'
import { PromptController } from '../../lib/prompt.controller'
import {
    AppOptionArg,
    ReuseWindowOptionArg,
    WaitForCloseOptionArg,
    appOption,
    reuseWindowOption,
    waitForCloseOption,
} from '../shared.options'
import { WorktreeController } from '../../lib/worktrees/worktree.controller'
import { GitService } from '../../lib/git.service'
import { customErrorWriter } from '../../lib/logger.service'

export const switchCommand = new Command()
    .createCommand('switch')
    .configureOutput(customErrorWriter)
    .alias('sw')
    .description('Switch to another worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action(async (branch, { subDir }: { subDir?: string }) => {
        const gitRepo = GitRepository.getInstance()
        const configService = ConfigService.getInstance()
        const contextService = ContextService.getInstance()
        const controller = OpenWorktreeController.init(
            WorktreeService.init(
                gitRepo,
                ProjectsService.init(gitRepo, configService),
                WorkflowService.init(configService, contextService),
                SysCallService.getInstance(),
            ),
            gitRepo,
            GitController.getInstance(),
            ContextService.getInstance(),
            OpenController.getInstance(),
            WorkflowController.init(
                WorkflowService.getInstance(),
                ContextService.getInstance(),
                SysCallService.getInstance(),
                PromptController.getInstance(),
            ),
            WorktreeController.init(
                gitRepo,
                GitService.getInstance(),
                WorktreeService.getInstance(),
                WorkflowController.getInstance(),
                PromptController.getInstance(),
            ),
        )

        await controller.openWorktree({ branch, subDir, reuseWindow: true })
    })

export const openCommand = new Command()
    .createCommand('open')
    .configureOutput(customErrorWriter)
    .alias('o')
    .description('Open a worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .addOption(appOption)
    .addOption(reuseWindowOption)
    .addOption(waitForCloseOption)
    .action(
        async (
            branch,
            options: { subDir?: string } & ReuseWindowOptionArg & AppOptionArg & WaitForCloseOptionArg,
        ) => {
            const gitRepo = GitRepository.getInstance()
            const configService = ConfigService.getInstance()
            const contextService = ContextService.getInstance()
            const controller = OpenWorktreeController.init(
                WorktreeService.init(
                    gitRepo,
                    ProjectsService.init(gitRepo, configService),
                    WorkflowService.init(configService, contextService),
                    SysCallService.getInstance(),
                ),
                gitRepo,
                GitController.getInstance(),
                ContextService.getInstance(),
                OpenController.getInstance(),
                WorkflowController.init(
                    WorkflowService.getInstance(),
                    ContextService.getInstance(),
                    SysCallService.getInstance(),
                    PromptController.getInstance(),
                ),
                WorktreeController.init(
                    gitRepo,
                    GitService.getInstance(),
                    WorktreeService.getInstance(),
                    WorkflowController.getInstance(),
                    PromptController.getInstance(),
                ),
            )

            await controller.openWorktree({ branch, ...options })
        },
    )
