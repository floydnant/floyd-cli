import { Command } from 'commander'
import path from 'path'
import { getWorktreeFromBranch, getWorktrees } from '../../adapters/git'
import { openWithVscode } from '../../lib/utils'
import { selectWorktrees } from './lib/select-worktrees'

const switchWorktree = async (branch: string | undefined, opts: { newWindow?: boolean; subDir?: string }) => {
    const openOpts = { reuse: !opts.newWindow }
    const worktrees = getWorktrees()

    if (branch) {
        const worktree = getWorktreeFromBranch(branch, worktrees)
        const folderPath = path.join(worktree.dir, opts.subDir || '')
        openWithVscode(folderPath, openOpts)
        return
    }

    const selectedWorktrees = await selectWorktrees(worktrees, { multiple: false })
    if (!selectedWorktrees?.length) return

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const folderPath = path.join(selectedWorktrees[0]!.dir, opts.subDir || '')
    openWithVscode(folderPath, openOpts)
}

export const switchCommand = new Command()
    .createCommand('switch')
    .alias('sw')
    .description('Switch to another worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-n, --new-window', 'use new vscode window', false)
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo')
    .action(switchWorktree)
