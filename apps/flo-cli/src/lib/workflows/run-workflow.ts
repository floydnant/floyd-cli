import '@total-typescript/ts-reset'
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
import prompts from 'prompts'

const notApplicableRegex = /<\$(\w+)_not_applicable>/g
/**
 * Check if any of the values contain a not applicable variable (value was not available).
 * i.e. if the value contains the string `not_applicable`
 * @param nestingLevel the current workflow's nesting level
 * @param valuesToCheck
 */
const checkAppliedVariables = async (
    nestingLevel: number,
    valuesToCheck: (string | undefined)[],
): Promise<'continue' | 'skip' | 'abort' | 'abort all'> => {
    const unapplicableVariables = valuesToCheck
        .filter(Boolean)
        .flatMap(value => Array.from(value.matchAll(notApplicableRegex)))
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        .map(v => v[1]!)
    const unapplicableVariablesNames = unapplicableVariables.map(variableName => variableName.cyan).join(', ')
    if (unapplicableVariables.length == 0) return 'continue'

    let { result }: { result?: 'continue' | 'skip' | 'abort' | 'abort all' } = await prompts({
        type: 'select',
        name: 'result',
        message:
            `The following variable(s) could not be applied because of unavailable values: ${unapplicableVariablesNames}`
                .red + ', what do you want to do?',
        choices: [
            { title: 'Skip this step', value: 'skip' },
            { title: 'Abort workflow', value: 'abort' },
            nestingLevel > 0 && {
                title: 'Abort workflow chain (all workflows)',
                value: 'abort all',
            },
            { title: 'Continue with uninterpolated value(s) (caution!)'.red, value: 'continue' },
        ].filter(Boolean),
    })
    if (!result) result = 'abort all'

    if (result == 'continue') Logger.log('Continuing step')
    if (result == 'skip') Logger.log('Skipping step')
    if (result == 'abort') Logger.log('Aborted workflow')
    if (result == 'abort all') Logger.log('Aborted all workflows')

    return result
}

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

            const result = await checkAppliedVariables(workflow.nestingLevel, [step.command, step.cwd])
            if (result == 'skip') continue
            if (result == 'abort') return
            if (result == 'abort all') return false

            sysCallService.exec(step.command, { cwd: step.cwd })
            continue
        }
        if (isResolvedFilesStep(step)) {
            logStep()

            const result = await checkAppliedVariables(workflow.nestingLevel, [step.copyFrom, step.to])
            if (result == 'skip') continue
            if (result == 'abort') return
            if (result == 'abort all') return false

            copyFileSync(step.copyFrom, step.to)

            continue
        }
        if (isResolvedWorflowStep(step)) {
            const result = await runWorkflow(step.workflow, opts)
            if (result === false) return false

            continue
        }

        return assertUnreachable(step)
    }
}
