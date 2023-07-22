import { Check, CheckRun, CheckRunStatus, Conclusion, PullRequest } from './github.model'

export const isCheckRun = (check: Check): check is CheckRun => check.__typename === 'CheckRun'

const statusString: Record<Conclusion | Exclude<CheckRunStatus, 'COMPLETED'>, (str: string) => string> = {
    SUCCESS: str => ('✔️  ' + str).green,
    FAILURE: str => ('×  ' + str).red,
    NEUTRAL: str => ('-  ' + str).dim,
    IN_PROGRESS: str => ('*  ' + str).yellow,
    QUEUED: str => 'Q'.yellow + `  [${'QUEUED'.yellow}] ` + str,
}

export const getCheckTitleString = (check: Check) => {
    const isCheckRun_ = isCheckRun(check)

    const workflowName = (isCheckRun_ && check.workflowName ? check.workflowName + ' / ' : '').dim
    const name = isCheckRun_ ? check.name : check.context
    const conclusion = isCheckRun_ ? check.conclusion : check.state

    const status = isCheckRun_ && check.status
    const statusStr = status ? `[${status.yellow}]` : ''

    return `${statusString[conclusion || status]?.(workflowName + name) || `${statusStr} ${name}`}`
}

export const filterFailedChecks = (pr: PullRequest): PullRequest => {
    return {
        ...pr,
        statusCheckRollup: pr.statusCheckRollup.filter(
            check => (isCheckRun(check) ? check.conclusion : check.state) === 'FAILURE',
        ),
    }
}
