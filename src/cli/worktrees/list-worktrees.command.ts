import { Command } from 'commander'
import { getBranchStatus, getCommitLogs, getWorktreeDisplayStr, getWorktrees } from '../../adapters/git'
import { getPaddedStr, indent } from '../../utils'

const listWorktrees = (opts: { logs?: boolean | string }) => {
    const worktrees = getWorktrees()
        .map(tree => {
            const worktreeStr = getWorktreeDisplayStr(tree)

            const status = getBranchStatus(tree.dir)
            const statusDisplay = !status ? ' Clean'.dim : status

            const logLimit = isNaN(parseInt(opts.logs as string)) ? 5 : (opts.logs as unknown as number)
            const commits = opts.logs ? '\n\n' + getCommitLogs(tree.dir, logLimit) : ''

            return `${getPaddedStr(worktreeStr)}\n${indent(statusDisplay, 3)}${indent(commits)}`
        })
        .join('\n\n')
    console.log('\n' + worktrees + '\n')
}

export const listWorktreesCommand = new Command()
    .createCommand('list')
    .alias('ls')
    .description('List worktrees')
    .option('-l, --logs [number]', 'Show recent commit logs')
    .action(listWorktrees)
