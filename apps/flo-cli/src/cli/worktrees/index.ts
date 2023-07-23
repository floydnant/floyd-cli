import { Command } from 'commander'
import { switchCommand } from './switch-worktree.command'
import { createWorktreeCommand } from './create-worktree.command'
import { deleteWorktreeCommand } from './delete-worktree.command'
import { listWorktreesCommand } from './list-worktrees.command'

// @TODO: Add a command to rename a worktree to the current branch name
// @TODO: Add ability to run workflows after creating / switching to a worktree

export const worktreesCommand = new Command()
    .createCommand('worktrees')
    .alias('tr')
    .description('Manage git worktrees')
    .addCommand(listWorktreesCommand, { isDefault: true })
    .addCommand(switchCommand)
    .addCommand(createWorktreeCommand)
    .addCommand(deleteWorktreeCommand)
