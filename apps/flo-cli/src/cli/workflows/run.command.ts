import { Command } from 'commander'
import { ConfigService } from '../../lib/config/config.service'
import { Logger } from '../../lib/logger.service'
import { printStepsOf } from '../../lib/workflows/print-workflow'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { ContextService } from '../../lib/config/context.service'
import { GitRepository } from '../../adapters/git'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { SysCallService } from '../../lib/sys-call.service'
import { PromptController } from '../../lib/prompt.controller'

export const runCommand = new Command()
    .createCommand('run')
    .description('Run predefined workflows, see Commands for avalable workflows')
    .action(() => {
        const configService = ConfigService.getInstance()
        const workflowService = WorkflowService.init(
            configService,
            ContextService.init(GitRepository.getInstance()),
        )
        const workflowController = WorkflowController.init(
            workflowService,
            ContextService.getInstance(),
            SysCallService.getInstance(),
            PromptController.getInstance(),
        )

        const subCommand = new Command('run')
        const workflows = configService.config.workflows || []
        workflows.forEach(workflow =>
            subCommand
                .command(workflow.workflowId)
                .aliases(workflow.aliases || [])
                .description([workflow.name, workflow.description].filter(Boolean).join(' - '))
                .option('-y, --yes', 'Run all steps without confirmation (takes precedence over `--confirm`)')
                .option('-c, --confirm', 'Force confirmation dialog')
                .option('-d, --dry', 'Dry run, list all steps without running them')
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
        subCommand.parse(arg)
    })
