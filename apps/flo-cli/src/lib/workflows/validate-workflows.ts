import { Logger } from '../logger.service'
import { Workflow } from './workflow.schemas'
import { isWorflowStep } from './workflow.utils'

export const validateWorkflows = (workflows: Workflow[] | undefined) => {
    const logger = Logger.getInstance()
    let isValid = true

    const seenWorkflowIds = new Set<string>()
    workflows?.forEach(workflow => {
        // validate workflowIds
        if (seenWorkflowIds.has(workflow.workflowId)) {
            logger.error(`Duplicate workflowId '${workflow.workflowId.blue}'`)
            isValid = false
        }
        seenWorkflowIds.add(workflow.workflowId)

        // validate aliases
        workflow.aliases?.forEach(alias => {
            if (seenWorkflowIds.has(alias)) {
                logger.error(`Duplicate alias '${alias.blue}' for workflow '${workflow.workflowId.blue}'`)
                isValid = false
            }
            seenWorkflowIds.add(alias)
        })
    })

    // validate steps
    workflows?.forEach(workflow => {
        if (workflow.steps.length == 0) {
            logger.error(`Workflow '${workflow.workflowId.blue}' has no steps`)
            isValid = false
        }
        workflow.steps.forEach(step => {
            if (isWorflowStep(step)) {
                if (!seenWorkflowIds.has(step.workflowId)) {
                    logger.error(
                        `Could not resolve workflow step ${workflow.workflowId.blue}.'${step.workflowId.blue}' in config`,
                    )
                    isValid = false
                }
            }
        })
    })

    return isValid
}
