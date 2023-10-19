import '@total-typescript/ts-reset'
import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { OpenController } from '../../lib/open/open.controller'
import { CreateWorktreeController } from '../../lib/worktrees/create-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { GitController } from '../../lib/git.controller'

export const createWorktreeCommand = new Command()
    .createCommand('create')
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
    .option(`-S, --skip-hooks`, 'skip running workflow hooks', false)
    .option(`--ub, --use-branch`, 'use branch name as directory for the worktree', false)
    .option('-r, --remote <remote>', 'which remote to fetch from')
    .option('--pr, --pull-request [number]', 'create a worktree from a pull request')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo when opening vscode')
    .action(
        (
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
            const controller = CreateWorktreeController.init(
                WorktreeService.init(gitRepo, ConfigService.getInstance()),
                gitRepo,
                GitController.getInstance(),
                ContextService.getInstance(),
                OpenController.getInstance(),
            )
            controller.createWorktree({ branch, ...opts })
        },
    )
