import { copyFileSync } from 'fs'
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assertUnreachable } from '../../../../../packages/common/src'
import { ConfigService } from '../config/config.service'
import { Logger } from '../logger.service'
import { exec } from '../utils'
import { Workflow } from './workflow.schemas'
import { resolveStep, isCommandStep, isFilesStep, isWorflowStep, filterSteps } from './workflow.utils'

export const runWorkflow = async (workflow: Workflow, opts: { yes?: boolean; confirm?: boolean } = {}) => {
    const workflowName = workflow.name?.blue || workflow.workflowId.magenta
    const logger = Logger.getInstance()
    const configService = ConfigService.getInstance()

    let steps = workflow.steps.map(resolveStep)

    if ((opts.confirm || workflow.confirm) && !opts.yes) {
        const filteredSteps = await filterSteps(steps)
        if (!filteredSteps) {
            logger.warn(`No steps to run for workflow '${workflowName}'`)
            return
        }
        steps = filteredSteps
    }

    logger.log('Running'.dim, workflowName, '...\n'.dim)

    for (const step of steps) {
        if (step.name) logger.verbose(step.name, '...'.dim)

        if (isCommandStep(step)) {
            exec(step.command, step.cwd)

            continue
        } else if (isFilesStep(step)) {
            copyFileSync(step.copyFrom, step.to)

            continue
        } else if (isWorflowStep(step)) {
            const workflow = configService.config.workflows?.find(w => w.workflowId == step.workflow)
            if (!workflow) {
                logger.error(`Could not find workflow '${step.workflow}' in config`)
                continue
            }

            await runWorkflow(workflow, opts)

            continue
        }

        return assertUnreachable(step)
    }
}
