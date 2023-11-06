import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { GitService } from '../../lib/git.service'
import { OpenController } from '../../lib/open/open.controller'
import { PromptController } from '../../lib/prompt.controller'
import { DoWorkorktreeController } from '../../lib/worktrees/do-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { GitController } from '../../lib/git.controller'
import { ProjectsService } from '../../lib/projects/projects.service'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { ContextService } from '../../lib/config/context.service'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { SysCallService } from '../../lib/sys-call.service'
import { WorktreeController } from '../../lib/worktrees/worktree.controller'
import {
    AppOptionArg,
    ReuseWindowOptionArg,
    SkipHooksOptionArg,
    appOption,
    reuseWindowOption,
    skipHooksOption,
} from '../shared.options'

export const doCommand = new Command()
    .createCommand('do')
    .description('Decides wether to choose an existing or create a new worktree')
    .argument(
        '<branch-or-pr>',
        'The branch or pull request to checkout. May be a local/remote branch, PR number or github URL.',
    )
    .argument(
        '[base-branch]',
        'Branch off of [base-branch] instead of the current branch - implies --new-branch',
    )
    // @TODO: this should be a subcommand
    // .option('-cl, --clean', 'Straight up open a clean worktree without touching it')
    // .addOption(skipHooksOption)
    .option(
        '-n, --new-branch',
        'Explicitly denote that you want to create a new branch instead of checking out an existing one.' +
            " - saves a few seconds because we don't need to check if the branch exists on the remote".dim,
        false,
    )
    .addOption(skipHooksOption)
    .addOption(appOption)
    .addOption(reuseWindowOption)
    .action(
        async (
            branchOrPr: string,
            baseBranch: string | undefined,
            options: { newBranch: boolean } & SkipHooksOptionArg & ReuseWindowOptionArg & AppOptionArg,
        ) => {
            const gitRepo = GitRepository.getInstance()
            const gitService = GitService.getInstance()
            const configService = ConfigService.getInstance()
            const projectsService = ProjectsService.init(gitRepo, configService)
            const contextService = ContextService.getInstance()
            const workflowService = WorkflowService.init(configService, contextService)
            const worktreeService = WorktreeService.init(gitRepo, projectsService, workflowService)
            const promptController = PromptController.getInstance()
            const workflowController = WorkflowController.init(
                workflowService,
                contextService,
                SysCallService.getInstance(),
                promptController,
            )
            const controller = DoWorkorktreeController.init(
                worktreeService,
                WorktreeController.init(
                    gitRepo,
                    gitService,
                    worktreeService,
                    workflowController,
                    promptController,
                ),
                workflowController,
                OpenController.getInstance(),
                gitRepo,
                gitService,
                GitController.getInstance(),
                promptController,
            )

            if (!branchOrPr) throw new Error("Value for argument 'branch-or-pr' is empty.")
            await controller.do({ input: branchOrPr, baseBranch, ...options })
        },
    )
