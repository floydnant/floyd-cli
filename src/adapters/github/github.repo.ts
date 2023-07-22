import { execSync } from 'child_process'
import { PullRequest } from './github.model'
import { exec } from '../../utils'

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

const viewChecks = (prNumberOrBranch: number | string | undefined) => {
    // gh throws if there are failed checks
    try {
        exec(`gh pr checks ${prNumberOrBranch ?? ''}`)
    } catch {}
}
