import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { GitController } from '../../lib/git.controller'
import { OpenController } from '../../lib/open/open.controller'
import { OpenWorktreeController } from '../../lib/worktrees/open-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'

export const switchCommand = new Command()
    .createCommand('switch')
    .alias('sw')
    .description('Switch to another worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action((branch, { subDir }: { subDir?: string }) => {
        const gitRepo = GitRepository.getInstance()
        const controller = OpenWorktreeController.init(
            WorktreeService.init(gitRepo, ConfigService.getInstance()),
            gitRepo,
            GitController.getInstance(),
            ContextService.getInstance(),
            OpenController.getInstance(),
        )

        controller.openWorktree({ branch, subDir, reuseWindow: true })
    })

export const openCommand = new Command()
    .createCommand('open')
    .alias('o')
    .description('Open a worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .option('-r, --reuse-window', 'Reuse existing window (if supported by app)', false)
    .action((branch, options: { subDir?: string; reuseWindow: boolean }) => {
        const gitRepo = GitRepository.getInstance()
        const controller = OpenWorktreeController.init(
            WorktreeService.init(gitRepo, ConfigService.getInstance()),
            gitRepo,
            GitController.getInstance(),
            ContextService.getInstance(),
            OpenController.getInstance(),
        )

        controller.openWorktree({ branch, ...options })
    })
