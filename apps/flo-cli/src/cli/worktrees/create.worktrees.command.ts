import '@total-typescript/ts-reset'
import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { OpenController } from '../../lib/open/open.controller'
import { CreateWorktreeController } from '../../lib/worktrees/create-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { GitController } from '../../lib/git.controller'
import { ProjectsService } from '../../lib/projects/projects.service'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { PromptController } from '../../lib/prompt.controller'
import { SysCallService } from '../../lib/sys-call.service'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { GithubRepository } from '../../adapters/github'
import { GitService } from '../../lib/git.service'
import { customErrorWriter } from '../../lib/logger.service'

export const createWorktreeCommand = new Command()
    .createCommand('create')
    .configureOutput(customErrorWriter)
    .alias('c')
    .description('Create a worktree with a new or existing branch')
    .argument('[branch]', 'new or existing branch to create the worktree for')
    .option(
        `-P, --no-worktree-prefix`,
        "wether to stick the name of the repo in front of the new worktree's directory",
    )
    .option('-u, --upstream-branch [upstream branch]', 'create a worktree from an upstream branch')
    .option(
        `--dir, --directory <path>`,
        'create the worktree in a custom directory (will take precedence over --use-branch)',
    )
    .option(`-s, --skip-hooks`, 'skip running workflow hooks', false)
    .option(`--ub, --use-branch`, 'use branch name as directory for the worktree', false)
    .option('-r, --remote <remote>', 'which remote to fetch from')
    .option('--pr, --pull-request [number]', 'create a worktree from a pull request')
    .option('-S, --sub-dir <path>', 'switch directly into a subdirectory of the repo when opening vscode')
    .action(
        async (
            branch: string | undefined,
            opts: {
                upstreamBranch?: boolean | string
                remote?: string
                pullRequest?: boolean | string
                subDir?: string
                directory?: string
                useBranch: boolean
                /** wether to stick the name of the repo in front of the new worktree's directory */
                worktreePrefix: boolean
                skipHooks: boolean
            },
        ) => {
            const gitRepo = GitRepository.getInstance()
            const configService = ConfigService.getInstance()
            const projectsService = ProjectsService.init(gitRepo, configService)
            const contextService = ContextService.getInstance()
            const workflowService = WorkflowService.init(configService, contextService)
            const controller = CreateWorktreeController.init(
                WorktreeService.init(gitRepo, projectsService, workflowService, SysCallService.getInstance()),
                gitRepo,
                GitService.getInstance(),
                GitController.getInstance(),
                ContextService.getInstance(),
                OpenController.getInstance(),
                WorkflowController.init(
                    WorkflowService.getInstance(),
                    ContextService.getInstance(),
                    SysCallService.getInstance(),
                    PromptController.getInstance(),
                ),
                GithubRepository.init(SysCallService.getInstance()),
            )

            await controller.createWorktree({ branch, ...opts })
        },
    )
