export interface PullRequest {
    number: number
    title: string
    url: string
    headRefName: string
    statusCheckRollup: Check[]
}

export type Conclusion = 'SUCCESS' | 'FAILURE' | 'NEUTRAL'
export type CheckRunStatus = 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED'
export type LowercaseConclusion = Lowercase<Conclusion>
export type LowercaseStatus = Lowercase<CheckRunStatus>

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

export type PrCheckRun = CheckRun & { prTitle: string; prNumber: number }

export interface StatusContext {
    __typename: 'StatusContext'
    context: string
    targetUrl: string
    state: Conclusion
    startedAt: string
}

export type Check = CheckRun | StatusContext

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

export interface Job {
    databaseId: number
    name: string
    conclusion: LowercaseConclusion
    status: LowercaseStatus
    startedAt: string
    url: string
    steps: Step[]
}

export interface Step {
    name: string
    number: number
    conclusion: LowercaseConclusion
    status: LowercaseStatus
}
