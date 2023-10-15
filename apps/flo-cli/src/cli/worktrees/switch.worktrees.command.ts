import { Command } from 'commander'
import path from 'path'
import { GitRepository, getWorktreeFromBranch } from '../../adapters/git'
import { ContextService } from '../../lib/config/context.service'
import { OpenService } from '../../lib/open/open.service'
import { OpenType } from '../../lib/open/open.types'
import { resolveWorkflow } from '../../lib/workflows/resolve-workflow'
import { runWorkflow } from '../../lib/workflows/run-workflow'
import { selectWorktrees } from '../../lib/worktrees/select-worktrees'
import { WorktreeHook } from '../../lib/worktrees/worktree-config.schemas'
import { getWorktreeHook } from '../../lib/worktrees/worktree-hooks'

// @TODO: @floydnant we should be able to checkout a new branch/PR from here
const openWorktree = async (opts: { branch: string | undefined; reuseWindow?: boolean; subDir?: string }) => {
    const gitRepo = GitRepository.getInstance()
    const contextService = ContextService.getInstance()
    const openService = OpenService.getInstance().useFirst(OpenType.Vscode)

    const worktrees = gitRepo.getWorktrees()
    const workflow = getWorktreeHook(WorktreeHook.OnSwitch)
    const openOpts = { reuseWindow: opts.reuseWindow }

    if (opts.branch) {
        const worktree = getWorktreeFromBranch(opts.branch, worktrees)
        const folderPath = path.join(worktree.directory, opts.subDir || '')

        if (workflow) {
            contextService.context.newWorktreeRoot = worktree.directory
            await runWorkflow(resolveWorkflow(workflow))
        }

        openService.open(folderPath, openOpts)
        return
    }

    const selectedWorktrees = await selectWorktrees(worktrees, { multiple: false })
    if (!selectedWorktrees?.length) return
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const worktree = selectedWorktrees[0]!

    if (workflow) {
        contextService.context.newWorktreeRoot = worktree.directory
        await runWorkflow(resolveWorkflow(workflow))
    }

    const folderPath = path.join(worktree.directory, opts.subDir || '')
    openService.open(folderPath, openOpts)
}

export const switchCommand = new Command()
    .createCommand('switch')
    .alias('sw')
    .description('Switch to another worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action((branch, { subDir }: { subDir?: string }) => {
        openWorktree({ branch, subDir, reuseWindow: true })
    })

export const openCommand = new Command()
    .createCommand('open')
    .alias('o')
    .description('Open a worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action((branch, { subDir }: { subDir?: string }) => {
        openWorktree({ branch, subDir, reuseWindow: false })
    })
