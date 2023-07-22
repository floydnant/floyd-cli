import { Command } from 'commander'
import path from 'path'
import { getWorktreeFromBranch, getWorktrees } from '../../adapters/git'
import { openWithVscode } from '../../utils'
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

    const folderPath = path.join(selectedWorktrees[0].dir, opts.subDir || '')
    openWithVscode(folderPath, openOpts)
}

export const switchCommand = new Command()
    .createCommand('switch')
    .alias('sw')
    .description('Switch to another worktree')
    .argument('[branch]', 'the branch to switch the worktree to')
    .option('-n, --newWindow', 'do not reuse vscode window', false)
    .option('-s, --subDir <path>', 'switch directly into a subdirectory of the repo')
    .action(switchWorktree)
