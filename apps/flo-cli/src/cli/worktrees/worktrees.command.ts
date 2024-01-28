import { Command } from 'commander'
import { createWorktreeCommand } from './create.worktrees.command'
import { deleteWorktreeCommand } from './delete.worktrees.command'
import { doCommand } from './do-worktree.command'
import { listWorktreesCommand } from './list.worktrees.command'
import { openCommand, switchCommand } from './switch.worktrees.command'
import { customErrorWriter } from '../../lib/logger.service'

// @TODO: Add a command to rename a worktree

export const worktreesCommand = new Command()
    .createCommand('worktrees')
    .configureOutput(customErrorWriter)
    .aliases(['wok', 'tr'])
    .description('Manage git worktrees')
    .addCommand(listWorktreesCommand)
    .addCommand(switchCommand)
    .addCommand(openCommand)
    .addCommand(createWorktreeCommand)
    .addCommand(deleteWorktreeCommand)
    .addCommand(doCommand, { isDefault: true })
