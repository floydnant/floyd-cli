import prompts from 'prompts'
// eslint-disable-next-line @nx/enforce-module-boundaries
import { assertUnreachable } from '../../../../../packages/common/src'
import { ConfigService } from '../config/config.service'
import { CommandStep, FileCopyStep, ResolvedStep, Step, WorkflowStep } from './step.schemas'

export const isCommandStep = (step: Step): step is CommandStep => 'command' in step
export const isFilesStep = (step: Step): step is FileCopyStep => 'copyFrom' in step
export const isWorflowStep = (step: Step): step is WorkflowStep => 'workflow' in step

export const resolveStep = (step: Step): ResolvedStep => {
    const configService = ConfigService.getInstance()

    if (isCommandStep(step)) {
        const command = configService.interpolateContextVars(step.command)
        const cwd = step.cwd && configService.interpolateContextVars(step.cwd)
        const defaultTitle = `Run \`${command.cyan}\`${cwd ? ' in ' + cwd.yellow : ''}`
        const name = step.name ? `${step.name} (${defaultTitle})` : defaultTitle

        return { ...step, name, cwd, command }
    }

    if (isFilesStep(step)) {
        const copyFrom = configService.interpolateContextVars(step.copyFrom)
        const to = configService.interpolateContextVars(step.to)
        const name = step.name || `Copy file from ${copyFrom.yellow} to ${to.yellow}`

        return { ...step, name, copyFrom, to }
    }

    if (isWorflowStep(step)) {
        const name = `Run workflow '${step.workflow}'`

        return { ...step, name }
    }

    return assertUnreachable(step)
}

export const filterSteps = async (steps: ResolvedStep[]) => {
    const { selectedSteps }: { selectedSteps?: ResolvedStep[] } = await prompts({
        name: 'selectedSteps',
        type: 'autocompleteMultiselect',
        message: 'Unselect steps to skip',
        choices: steps.map<prompts.Choice>(step => ({
            title: step.name || 'Unnamed step (if you see this, something is off)',
            value: step,
            selected: true,
        })),
    })
    if (!selectedSteps) return null

    return selectedSteps
}
