import { copyFileSync } from 'fs'
import { Logger } from '../logger.service'
import { PromptController } from '../prompt.controller'
import { SysCallService } from '../sys-call.service'
import { getPaddedStr, indent } from '../utils'
import { ResolvedWorkflow, Workflow } from './workflow.schemas'
import {
    filterSteps,
    isResolvedCommandStep,
    isResolvedFilesStep,
    isResolvedWorflowStep,
} from './workflow.utils'
import { printStep } from './print-workflow'
import { WorkflowService } from './workflow.service'
import { CliContext, ContextService } from '../config/context.service'
import { assertUnreachable } from '@flo/common'

export class WorkflowController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private workflowService: WorkflowService,
        private contextService: ContextService,
        private sysCallService: SysCallService,
        private promptController: PromptController,
    ) {}

    async runWorkflow(
        workflow: Workflow,
        context?: Partial<CliContext>,
        opts: { yes?: boolean; confirm?: boolean } = {},
    ) {
        if (context) this.contextService.updateContext(context)

        const resolvedWorkflow = this.workflowService.resolveWorkflow(workflow)
        return await this.runResolvedWorkflow(resolvedWorkflow, opts)
    }

    async runResolvedWorkflow(workflow: ResolvedWorkflow, opts: { yes?: boolean; confirm?: boolean } = {}) {
        const workflowName = workflow.name
        const logger = Logger.getInstance()

        let steps = workflow.steps

        if ((opts.confirm || workflow.confirm) && !opts.yes) {
            const filteredSteps = await filterSteps(steps)
            if (!filteredSteps) {
                logger.warn(`User abortion`)
                return
            }
            if (!filteredSteps.length) {
                logger.warn(`No steps left after filtering on workflow '${workflowName}'`)
                return
            }
            steps = filteredSteps
        }

        logger.log(getPaddedStr(indent(workflowName, workflow.nestingLevel * 4), '-'.blue))

        for (const step of steps) {
            const logStep = () => printStep(step, workflow.nestingLevel, logger.verbose, false)

            if (isResolvedCommandStep(step)) {
                logStep()

                const result = await this.checkAppliedVariables(workflow.nestingLevel, [
                    step.command,
                    step.cwd,
                ])
                if (result == 'skip') continue
                if (result == 'abort') return
                if (result == 'abort all') return false

                this.sysCallService.execInherit(step.command, { cwd: step.cwd })
                continue
            }
            if (isResolvedFilesStep(step)) {
                logStep()

                const result = await this.checkAppliedVariables(workflow.nestingLevel, [
                    step.copyFrom,
                    step.to,
                ])
                if (result == 'skip') continue
                if (result == 'abort') return
                if (result == 'abort all') return false

                copyFileSync(step.copyFrom, step.to)

                continue
            }
            if (isResolvedWorflowStep(step)) {
                const result = await this.runResolvedWorkflow(step.workflow, opts)
                if (result === false) return false

                continue
            }

            return assertUnreachable(step)
        }
    }

    /**
     * Check if any of the values contain a not applicable variable (value was not available).
     * i.e. if the value contains the string `not_applicable`
     * @param nestingLevel the current workflow's nesting level
     * @param valuesToCheck
     */
    private async checkAppliedVariables(
        nestingLevel: number,
        valuesToCheck: (string | undefined)[],
    ): Promise<'continue' | 'skip' | 'abort' | 'abort all'> {
        const unapplicableVariables = valuesToCheck
            .filter(Boolean)
            .flatMap(value => Array.from(value.matchAll(/<\$(\w+)_not_applicable>/g)))
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map(v => v[1]!)
        const unapplicableVariablesNames = unapplicableVariables
            .map(variableName => variableName.cyan)
            .join(', ')
        if (unapplicableVariables.length == 0) return 'continue'

        let result = await this.promptController.select<'continue' | 'skip' | 'abort' | 'abort all'>({
            message:
                `The following variable(s) could not be applied because of unavailable values: ${unapplicableVariablesNames}`
                    .red + ', what do you want to do?',
            choices: [
                { title: 'Skip this step', value: 'skip' },
                { title: 'Abort workflow', value: 'abort' },
                nestingLevel > 0 &&
                    ({
                        title: 'Abort workflow chain (all workflows)',
                        value: 'abort all',
                    } as const),
                { title: 'Continue with uninterpolated value(s) (caution!)'.red, value: 'continue' },
            ] as const,
        })
        if (!result) result = 'abort all'

        if (result == 'continue') Logger.log('Continuing step')
        if (result == 'skip') Logger.log('Skipping step')
        if (result == 'abort') Logger.log('Aborted workflow')
        if (result == 'abort all') Logger.log('Aborted all workflows')

        return result
    }

    private static instance: WorkflowController
    static init(...args: ConstructorParameters<typeof WorkflowController>) {
        if (this.instance) {
            Logger.warn(`${WorkflowController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new WorkflowController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${WorkflowController.name} not initialized`)
        return this.instance
    }
}
