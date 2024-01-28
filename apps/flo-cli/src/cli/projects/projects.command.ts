import { Command } from 'commander'
import { listCommand } from './list.command'
import { openCommand } from './open.command'
import { addCommand } from './add.command'
import { customErrorWriter } from '../../lib/logger.service'

export const projectsCommand = new Command('projects')
    .description('Manage projects')
    .alias('p')
    .configureOutput(customErrorWriter)

projectsCommand.addCommand(listCommand, { isDefault: true })
projectsCommand.addCommand(openCommand)
projectsCommand.addCommand(addCommand)

// @TODO: Implement more commands
// - update (relocate/rename/remove) projects
// - manage project hooks
