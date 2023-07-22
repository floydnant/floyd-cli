import prompts from 'prompts'
import { UnwrapArray } from '../../../utils'
import { PullRequest, isCheckRun, getCheckTitleString, CheckRun } from '../../../adapters/github'

export const getCheckChoices = (prs: PullRequest[]) =>
    prs
        .map(pr => {
            const prTitle = `${'#' + pr.number} ${pr.title.dim}`
            return pr.statusCheckRollup.map(check => {
                const isCheckRun_ = isCheckRun(check)
                const isCompleted = isCheckRun_ ? check.status == 'COMPLETED' : true

                return {
                    title: `${prTitle} ${getCheckTitleString(check)}`,
                    disabled:
                        !isCheckRun_ || !isCompleted || !/^https:\/\/github\.com/.test(check.detailsUrl),
                    description: isCheckRun_ ? '' : 'StatusContexts cannot be rerun',
                    value: { ...check, prTitle, prNumber: pr.number },
                } satisfies prompts.Choice
            })
        })
        .flat()

export type ChoiceValue = UnwrapArray<ReturnType<typeof getCheckChoices>>['value']
export type CheckRunChoiceValue = Extract<ChoiceValue, CheckRun>
