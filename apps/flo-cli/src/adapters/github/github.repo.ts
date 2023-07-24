import { execSync } from 'child_process'
import { exec } from '../../lib/utils'
import { PullRequest, Run } from './github.model'

export const getPr = (
    prNumberOrBranch: number | string | undefined,
    opts?: { checks?: boolean },
): PullRequest => {
    const fetchChecks = opts?.checks ?? true

    try {
        const jsonStr = execSync(
            `gh pr view ${prNumberOrBranch ?? ''} --json number,title,url,headRefName${
                fetchChecks ? ',statusCheckRollup' : ''
            }`,
        ).toString()
        return JSON.parse(jsonStr)
    } catch {
        process.exit(1)
    }
}

export const getOpenPrs = (opts?: { checks?: boolean }): PullRequest[] => {
    const fetchChecks = opts?.checks ?? true

    const jsonStr = execSync(
        `gh pr list --json number,title,url,headRefName${fetchChecks ? ',statusCheckRollup' : ''}`,
    ).toString()
    return JSON.parse(jsonStr)
}

export const viewChecks = (prNumberOrBranch: number | string | undefined) => {
    // gh throws if there are failed checks
    try {
        exec(`gh pr checks ${prNumberOrBranch ?? ''}`)
    } catch {
        // silently do nothing
    }
}

export const getRun = (runId: string | number) => {
    try {
        const str = execSync(
            `gh run view ${runId} --json name,url,jobs,conclusion,databaseId,event,number,displayTitle,status,workflowName,workflowDatabaseId`,
        ).toString()
        return JSON.parse(str) as Run
    } catch {
        // silently fail
    }
}
