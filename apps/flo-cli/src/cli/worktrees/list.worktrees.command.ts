import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { ListWorktreeController } from '../../lib/worktrees/list-worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'

export const listWorktreesCommand = new Command()
    .createCommand('list')
    .alias('ls')
    .description('List worktrees')
    .option('-l, --logs [number]', 'Show recent commit logs')
    .action((opts: { logs?: boolean | string }) => {
        const gitRepo = GitRepository.getInstance()
        const configService = ConfigService.getInstance()
        const controller = ListWorktreeController.init(WorktreeService.init(gitRepo, configService), gitRepo)

        return controller.listWorktrees(opts)
    })
