import { Command } from 'commander'
import { ConfigService } from '../../lib/config/config.service'
import { ContextService } from '../../lib/config/context.service'
import { Logger, customErrorWriter } from '../../lib/logger.service'
import { PromptController } from '../../lib/prompt.controller'
import { SysCallService } from '../../lib/sys-call.service'
import { printStepsOf } from '../../lib/workflows/print-workflow'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { WorkflowService } from '../../lib/workflows/workflow.service'

export const runCommand = new Command()
    .createCommand('run')
    .description('Run predefined workflows, see subcommands for avalable workflows')
    .configureOutput(customErrorWriter)
    .allowUnknownOption(true) // pass through options to shadow command
    .helpOption(false) // disable help so that we always delegate to the shadow command which in turn handles help
    .action(async () => {
        const configService = ConfigService.getInstance()
        const workflowService = WorkflowService.init(configService, ContextService.getInstance())
        const workflowController = WorkflowController.init(
            workflowService,
            ContextService.getInstance(),
            SysCallService.getInstance(),
            PromptController.getInstance(),
        )

        const shadowCommand = new Command('run')
            .description('Run predefined workflows, see Commands for avalable workflows')
            .configureOutput(customErrorWriter)
        const workflows = configService.config.workflows || []
        workflows.forEach(workflow =>
            shadowCommand
                .command(workflow.workflowId)
                .configureOutput(customErrorWriter)
                .aliases(workflow.aliases || [])
                .description([workflow.name, workflow.description].filter(Boolean).join(' - '))
                .option('-y, --yes', 'Run all steps without confirmation (takes precedence over `--confirm`)')
                .option('-c, --confirm', 'Force confirmation dialog')
                .option('--dry', 'Dry run, list all steps without running them')
                .action(async (opts: { yes?: boolean; confirm?: boolean; dry?: boolean }) => {
                    const resolvedWorkflow = workflowService.resolveWorkflow(workflow)

                    if (opts.dry) {
                        Logger.log().log('Steps for ' + resolvedWorkflow.name)
                        printStepsOf(resolvedWorkflow)
                        Logger.log()
                        return
                    }

                    Logger.log()
                    await workflowController.runResolvedWorkflow(resolvedWorkflow, opts)
                    Logger.log()
                }),
        )

        const arg = process.argv.filter(arg => arg !== 'run' && arg !== '--debug')
        await shadowCommand.parseAsync(arg)
    })
