import { execSync } from 'child_process'
import { PullRequest, PullRequestWithChecks, Run } from './github.model'
import { MaskOf } from '@flo/common'
import { Logger } from '../../lib/logger.service'
import { SysCallService } from '../../lib/sys-call.service'

const getFieldSelector = <TMask extends MaskOf<PullRequest>>(mask: TMask) => {
    const keys = Object.entries(mask)
        .map(([key, value]) => (value ? key : undefined))
        .filter(Boolean) as {
        [K in keyof TMask]: TMask[K] extends true ? K : never
    }[keyof TMask][]
    return keys
}
const defaultPullRequestSelectFields = {
    headRefName: true,
    number: true,
    title: true,
    url: true,
} as const

export const getPullRequest = <TOpts extends { checks?: boolean }>(
    prNumberOrBranch: number | string | undefined,
    opts?: TOpts,
): TOpts['checks'] extends true ? PullRequestWithChecks : PullRequest => {
    const fetchChecks = opts?.checks ?? true

    const jsonSelectFields = getFieldSelector({
        ...defaultPullRequestSelectFields,
        statusCheckRollup: fetchChecks,
    })

    try {
        const jsonStr = execSync(
            `gh pr view ${prNumberOrBranch ?? ''} --json ${jsonSelectFields.join(',')}`,
        ).toString()
        // @TODO: @floydnant this is dangerous
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.parse(jsonStr) as any
    } catch (e) {
        const logger = Logger.getInstance()
        logger.debug(e)
        logger.error(`Could not find pull request for ${prNumberOrBranch}`)
        process.exit(1)
    }
}

export const getOpenPullRequests = <TOpts extends { checks?: boolean }>(
    opts?: TOpts,
): TOpts['checks'] extends true ? PullRequestWithChecks[] : PullRequest[] => {
    const fetchChecks = opts?.checks ?? true

    const jsonSelectFields = getFieldSelector({
        ...defaultPullRequestSelectFields,
        statusCheckRollup: fetchChecks,
    })

    try {
        const jsonStr = execSync(`gh pr list --json ${jsonSelectFields.join(',')}`).toString()
        // @TODO: @floydnant this is dangerous
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return JSON.parse(jsonStr) as any
    } catch (e) {
        const logger = Logger.getInstance()
        logger.debug(e)
        logger.error(`Could not fetch open pull requests`)
        process.exit(1)
    }
}

export const viewChecks = (prNumberOrBranch: number | string | undefined) => {
    const sysCallService = SysCallService.getInstance()

    // gh throws if there are failed checks
    try {
        sysCallService.execInherit(`gh pr checks ${prNumberOrBranch ?? ''}`)
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
    } catch (e) {
        const logger = Logger.getInstance()
        logger.debug(e)
        logger.error(`Could not fetch run with id ${runId}`)
        process.exit(1)
    }
}
