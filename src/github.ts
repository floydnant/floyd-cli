import { execSync } from 'child_process'
import { exec } from './utils'

export interface PR {
    number: number
    title: string
    url: string
    statusCheckRollup: Check[]
}
type Conclusion = 'SUCCESS' | 'FAILURE' | 'NEUTRAL'
type LowercaseConclusion = Lowercase<Conclusion>
type CheckRunStatus = 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED'
type LowercaseStatus = Lowercase<CheckRunStatus>
export interface CheckRun {
    __typename: 'CheckRun'
    workflowName: string
    name: string
    detailsUrl: string
    conclusion: Conclusion
    status: CheckRunStatus
    startedAt: string
    completedAt: string
}
interface StatusContext {
    __typename: 'StatusContext'
    context: string
    targetUrl: string
    state: Conclusion
    startedAt: string
}
type Check = CheckRun | StatusContext
export const isCheckRun = (check: Check): check is CheckRun => check.__typename === 'CheckRun'
export interface Run {
    databaseId: number
    displayTitle: string
    name: string
    url: string
    number: number
    conclusion: LowercaseConclusion
    status: LowercaseStatus
    workflowDatabaseId: number
    workflowName: string
    event: string
    jobs: Job[]
}
interface Job {
    databaseId: number
    name: string
    conclusion: LowercaseConclusion
    status: LowercaseStatus
    startedAt: string
    url: string
    steps: Step[]
}
interface Step {
    name: string
    number: number
    conclusion: LowercaseConclusion
    status: LowercaseStatus
}
const viewChecks = (prNumberOrBranch: number | string | undefined) => {
    // gh throws if there are failed checks
    try {
        exec(`gh pr checks ${prNumberOrBranch ?? ''}`)
    } catch {}
}
export const getPr = (prNumberOrBranch: number | string | undefined): PR => {
    try {
        const jsonStr = execSync(
            `gh pr view ${prNumberOrBranch ?? ''} --json number,title,url,statusCheckRollup`,
        ).toString()
        return JSON.parse(jsonStr)
    } catch {
        process.exit(1)
    }
}
export const getOpenPrs = (): PR[] => {
    const jsonStr = execSync(`gh pr list --json number,title,url,statusCheckRollup`).toString()
    return JSON.parse(jsonStr)
}
export const filterFailedChecks = (pr: PR): PR => {
    return {
        ...pr,
        statusCheckRollup: pr.statusCheckRollup.filter(
            check => (isCheckRun(check) ? check.conclusion : check.state) === 'FAILURE',
        ),
    }
}
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
