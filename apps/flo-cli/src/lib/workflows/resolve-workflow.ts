// eslint-disable-next-line @nx/enforce-module-boundaries
import { assertUnreachable } from '../../../../../packages/common/src'
import { ConfigService } from '../config/config.service'
import { ContextService } from '../config/context.service'
import { Logger } from '../logger.service'
import { getRelativePathOf } from '../utils'
import { ResolvedWorkflow, Workflow } from './workflow.schemas'
import { isCommandStep, isFilesStep, isWorflowStep } from './workflow.utils'

export const resolveWorkflow = (workflow: Workflow, nestingLevel = 0): ResolvedWorkflow => {
    const configService = ConfigService.getInstance()
    const contextService = ContextService.getInstance()
    const name = workflow.name?.blue || workflow.workflowId.blue
    const workflowCwd = workflow.cwd && contextService.interpolateContextVars(workflow.cwd)

    const steps = workflow.steps.map(step => {
        if (isCommandStep(step)) {
            const command = contextService.interpolateContextVars(step.command)
            const cwd_ = step.cwd || workflowCwd
            const cwd = cwd_ && contextService.interpolateContextVars(cwd_)
            const defaultName = `${command.cyan}${cwd ? ' in ' + getRelativePathOf(cwd.yellow) : ''}`
            const name = step.name ? `${step.name} - ${defaultName}` : defaultName

            return { ...step, name, command, cwd }
        }

        if (isFilesStep(step)) {
            const copyFrom = getRelativePathOf(contextService.interpolateContextVars(step.copyFrom))
            const to = getRelativePathOf(contextService.interpolateContextVars(step.to))
            const defaultName = `Copy file from ${copyFrom.yellow} to ${to.yellow}`
            const name = step.name ? `${step.name} - ${defaultName}` : defaultName

            return { ...step, name, copyFrom, to }
        }

        if (isWorflowStep(step)) {
            const stepWorkflow = configService.config.workflows?.find(w => w.workflowId == step.workflowId)
            if (!stepWorkflow) {
                // This should never happen, because the config is validated on startup
                Logger.error(`Could not find workflow '${step.workflowId.blue}' in config`)
                process.exit(1)
            }

            const cwd_ = step.cwd || stepWorkflow.cwd || workflowCwd
            const cwd = cwd_ && getRelativePathOf(contextService.interpolateContextVars(cwd_))
            const defaultName = `Run workflow ${(stepWorkflow.name || stepWorkflow.workflowId).blue}${
                cwd ? ' in ' + cwd.yellow : ''
            }`
            const name = step.name ? `${step.name} - ${defaultName}` : defaultName
            const resolvedWorkflow = resolveWorkflow(stepWorkflow, nestingLevel + 1)

            return { ...step, name, workflow: { ...resolvedWorkflow, name } }
        }

        return assertUnreachable(step)
    })

    return { ...workflow, name, steps, nestingLevel }
}
