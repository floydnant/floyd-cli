import { Command } from 'commander'
import path from 'path'
import { getWorktreeFromBranch, getWorktrees } from '../../adapters/git'
import { openWithVscode } from '../../lib/utils'
import { selectWorktrees } from './lib/select-worktrees'
import { ConfigService } from '../../lib/config/config.service'
import { runWorkflow } from '../../lib/workflows/run-workflow'
import { WorktreeHook } from '../../lib/worktrees/worktree-config.schemas'
import { getWorktreeHook } from '../../lib/worktrees/worktree-hooks'

const openWorktree = async (opts: { branch: string | undefined; newWindow?: boolean; subDir?: string }) => {
    const openOpts = { reuse: !opts.newWindow }
    const worktrees = getWorktrees()
    const workflow = getWorktreeHook(WorktreeHook.OnSwitch)

    if (opts.branch) {
        const worktree = getWorktreeFromBranch(opts.branch, worktrees)
        const folderPath = path.join(worktree.dir, opts.subDir || '')

        if (workflow) {
            ConfigService.getInstance().contextVariables.newWorktreeRoot = worktree.dir
            await runWorkflow(workflow)
        }

        openWithVscode(folderPath, openOpts)
        return
    }

    const selectedWorktrees = await selectWorktrees(worktrees, { multiple: false })
    if (!selectedWorktrees?.length) return
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const worktree = selectedWorktrees[0]!

    if (workflow) {
        ConfigService.getInstance().contextVariables.newWorktreeRoot = worktree.dir
        await runWorkflow(workflow)
    }

    const folderPath = path.join(worktree.dir, opts.subDir || '')
    openWithVscode(folderPath, openOpts)
}

export const switchCommand = new Command()
    .createCommand('switch')
    .alias('sw')
    .description('Switch to another worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action((branch, { subDir }: { subDir?: string }) => {
        openWorktree({ branch, subDir, newWindow: false })
    })

export const openCommand = new Command()
    .createCommand('open')
    .alias('o')
    .description('Open a worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action((branch, { subDir }: { subDir?: string }) => {
        openWorktree({ branch, subDir, newWindow: true })
    })
