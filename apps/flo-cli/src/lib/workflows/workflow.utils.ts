import prompts from 'prompts'
import {
    CommandStep,
    FileCopyStep,
    ResolvedCommandStep,
    ResolvedFileCopyStep,
    ResolvedStep,
    ResolvedWorkflowStep,
    Step,
    WorkflowStep,
} from './step.schemas'

export const isCommandStep = (step: Step): step is CommandStep => 'command' in step
export const isResolvedCommandStep = (step: ResolvedStep): step is ResolvedCommandStep => 'command' in step

export const isFilesStep = (step: Step): step is FileCopyStep => 'copyFrom' in step
export const isResolvedFilesStep = (step: ResolvedStep): step is ResolvedFileCopyStep => 'copyFrom' in step

export const isWorflowStep = (step: Step): step is WorkflowStep => 'workflowId' in step
export const isResolvedWorflowStep = (step: ResolvedStep): step is ResolvedWorkflowStep =>
    'workflowId' in step

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
