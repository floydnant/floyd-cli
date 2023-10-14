import { copyFileSync } from 'fs'
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assertUnreachable } from '../../../../../packages/common/src'
import { Logger } from '../logger.service'
import { getPaddedStr, indent } from '../utils'
import { ResolvedWorkflow } from './workflow.schemas'
import {
    filterSteps,
    isResolvedCommandStep,
    isResolvedFilesStep,
    isResolvedWorflowStep,
} from './workflow.utils'
import { printStep } from './print-workflow'
import { SysCallService } from '../sys-call.service'

export const runWorkflow = async (
    workflow: ResolvedWorkflow,
    opts: { yes?: boolean; confirm?: boolean } = {},
) => {
    const workflowName = workflow.name
    const logger = Logger.getInstance()
    const sysCallService = SysCallService.getInstance()

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
            sysCallService.exec(step.command, { cwd: step.cwd })

            continue
        }
        if (isResolvedFilesStep(step)) {
            logStep()
            copyFileSync(step.copyFrom, step.to)

            continue
        }
        if (isResolvedWorflowStep(step)) {
            await runWorkflow(step.workflow, opts)

            continue
        }

        return assertUnreachable(step)
    }
}
