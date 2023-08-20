import { Logger } from '../logger.service'
import { indent } from '../utils'
import { ResolvedStep } from './step.schemas'
import { ResolvedWorkflow } from './workflow.schemas'
import { isResolvedWorflowStep } from './workflow.utils'

export const printStep = (
    step: ResolvedStep,
    nestingLevel: number,
    logFn: (msg: string) => void = Logger.getInstance().log,
    recursive = true,
) => {
    logFn(indent(step.name, (nestingLevel + 1) * 4))

    if (recursive && isResolvedWorflowStep(step)) printStepsOf(step.workflow, logFn)
}

export const printStepsOf = (workflow: ResolvedWorkflow, logFn?: (msg: string) => void) => {
    workflow.steps.forEach(step => printStep(step, workflow.nestingLevel, logFn))
}
