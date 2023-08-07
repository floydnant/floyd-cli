import { Command } from 'commander'
import { ConfigService } from '../../lib/config/config.service'
import { runWorkflow } from '../../lib/workflows/run-workflow'

export const runCommand = new Command()
    .createCommand('run')
    .description('Run predefined workflows, see Commands for avalable workflows')

const workflows = ConfigService.getInstance().config.workflows || []
workflows.forEach(workflow =>
    runCommand
        .command(workflow.workflowId)
        .aliases(workflow.aliases || [])
        .description([workflow.name, workflow.description].filter(Boolean).join(' - '))
        .option('-y, --yes', 'Run all steps without confirmation (takes precedence over `--confirm`)')
        .option('-c, --confirm', 'Force confirmation dialog')
        .action((opts: { yes?: boolean; confirm?: boolean }) => runWorkflow(workflow, opts)),
)
