import { Command } from 'commander'
import { createWorktreeCommand } from './create.worktrees.command'
import { deleteWorktreeCommand } from './delete.worktrees.command'
import { listWorktreesCommand } from './list.worktrees.command'
import { openCommand, switchCommand } from './switch.worktrees.command'

// @TODO: Add a command to rename a worktree

export const worktreesCommand = new Command()
    .createCommand('worktrees')
    .aliases(['wok', 'tr'])
    .description('Manage git worktrees')
    .addCommand(listWorktreesCommand, { isDefault: true })
    .addCommand(switchCommand)
    .addCommand(openCommand)
    .addCommand(createWorktreeCommand)
    .addCommand(deleteWorktreeCommand)
