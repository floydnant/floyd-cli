import { Command } from 'commander'

// @TODO: Manage workflows: create, edit, list, delete, run
export const workflowsCommand = new Command()
    .createCommand('workflows')
    .alias('wf')
    .description('Manage custom workflows')
