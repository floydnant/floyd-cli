import { assertUnreachable } from '@flo/common'
import { ConfigService } from '../config/config.service'
import { ContextService } from '../config/context.service'
import { Logger } from '../logger.service'
import { getRelativePathOf } from '../utils'
import { ResolvedWorkflow, Workflow } from './workflow.schemas'
import { isCommandStep, isFilesStep, isWorflowStep } from './workflow.utils'

export class WorkflowService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private configService: ConfigService,
        private contextService: ContextService,
    ) {}

    getWorkflow(workflowId: string): Workflow | undefined {
        const workflow = this.configService.config.workflows?.find(flow => flow.workflowId == workflowId)
        if (!workflow) Logger.warn(`Could not find a workflow with ID ${workflowId}`)
        return workflow
    }

    resolveWorkflow(workflow: Workflow, nestingLevel = 0): ResolvedWorkflow {
        const name = workflow.name?.blue || workflow.workflowId.blue
        const workflowCwd = workflow.cwd && this.contextService.interpolateContextVars(workflow.cwd)

        const steps = workflow.steps.map(step => {
            if (isCommandStep(step)) {
                const command = this.contextService.interpolateContextVars(step.command)
                const cwd_ = step.cwd || workflowCwd
                const cwd = cwd_ && this.contextService.interpolateContextVars(cwd_)
                const defaultName = `${command.cyan}${cwd ? ' in ' + getRelativePathOf(cwd.yellow) : ''}`
                const name = step.name ? `${step.name} - ${defaultName}` : defaultName

                return { ...step, name, command, cwd }
            }

            if (isFilesStep(step)) {
                const copyFrom = getRelativePathOf(this.contextService.interpolateContextVars(step.copyFrom))
                const to = getRelativePathOf(this.contextService.interpolateContextVars(step.to))
                const defaultName = `Copy file from ${copyFrom.yellow} to ${to.yellow}`
                const name = step.name ? `${step.name} - ${defaultName}` : defaultName

                return { ...step, name, copyFrom, to }
            }

            if (isWorflowStep(step)) {
                const stepWorkflow = this.configService.config.workflows?.find(
                    w => w.workflowId == step.workflowId,
                )
                if (!stepWorkflow) {
                    // This should never happen, because the config is validated on startup
                    Logger.error(`Could not find workflow '${step.workflowId.blue}' in config`)
                    process.exit(1)
                }

                const cwd_ = step.cwd || stepWorkflow.cwd || workflowCwd
                const cwd = cwd_ && getRelativePathOf(this.contextService.interpolateContextVars(cwd_))
                const defaultName = `Run workflow ${(stepWorkflow.name || stepWorkflow.workflowId).blue}${
                    cwd ? ' in ' + cwd.yellow : ''
                }`
                const name = step.name ? `${step.name} - ${defaultName}` : defaultName
                const resolvedWorkflow = this.resolveWorkflow(stepWorkflow, nestingLevel + 1)

                return { ...step, name, workflow: { ...resolvedWorkflow, name } }
            }

            return assertUnreachable(step)
        })

        return { ...workflow, name, steps, nestingLevel }
    }

    private static instance: WorkflowService
    static init(...args: ConstructorParameters<typeof WorkflowService>) {
        if (this.instance) {
            Logger.warn(`${WorkflowService.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new WorkflowService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${WorkflowService.name} not initialized`)
        return this.instance
    }
}
