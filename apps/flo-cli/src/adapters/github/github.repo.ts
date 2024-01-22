import { MaskOf } from '@flo/common'
import { Installed } from '../../lib/installed.interface'
import { Logger } from '../../lib/logger.service'
import { SysCallService } from '../../lib/sys-call.service'
import { PullRequest, PullRequestWithChecks, Run } from './github.model'

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

export class GithubRepository implements Installed {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private sysCallService: SysCallService) {}

    isInstalled(): boolean {
        return this.sysCallService.testCommand('gh --version')
    }
    assertInstalled(): void {
        if (this.isInstalled()) return

        // @TODO: We can prompt wether we should directly install gh for the user
        const isHomebrewInstalled = this.sysCallService.testCommand('brew --version')
        const errorMessage = isHomebrewInstalled
            ? 'Please install gh cli with `brew install gh`'
            : 'Please install gh cli: https://cli.github.com/manual/installation'

        // @TODO: this should be a custom exception
        throw new Error(errorMessage)
    }

    getPullRequest = <TOpts extends { checks?: boolean }>(
        prNumberOrBranch: number | string | undefined,
        opts?: TOpts,
    ): TOpts['checks'] extends true ? PullRequestWithChecks : PullRequest => {
        const fetchChecks = opts?.checks ?? true

        const jsonSelectFields = getFieldSelector({
            ...defaultPullRequestSelectFields,
            statusCheckRollup: fetchChecks,
        })

        // @TODO: this should be handled in a transformer function
        try {
            const jsonStr = this.sysCallService.execPipe(
                `gh pr view ${prNumberOrBranch ?? ''} --json ${jsonSelectFields.join(',')}`,
            )

            // @TODO: consider validating this
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return JSON.parse(jsonStr) as any
        } catch (e) {
            Logger.debug(e)

            if (e instanceof SyntaxError) {
                throw new Error(`Failed to parse github's response for ${prNumberOrBranch}`)
            }

            throw new Error(`Could not find pull request for ${prNumberOrBranch}`)
        }
    }

    listOpenPullRequests = <TOpts extends { checks?: boolean }>(
        opts?: TOpts,
    ): TOpts['checks'] extends true ? PullRequestWithChecks[] : PullRequest[] => {
        const fetchChecks = opts?.checks ?? true

        const jsonSelectFields = getFieldSelector({
            ...defaultPullRequestSelectFields,
            statusCheckRollup: fetchChecks,
        })

        // @TODO: this should be handled in a transformer function
        try {
            const jsonStr = this.sysCallService.execPipe(`gh pr list --json ${jsonSelectFields.join(',')}`)

            // @TODO: consider validating this
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return JSON.parse(jsonStr) as any
        } catch (e) {
            Logger.debug(e)

            if (e instanceof SyntaxError) {
                throw new Error(`Failed to parse github's response`)
            }

            throw new Error(`Could not fetch open pull requests`)
        }
    }

    viewChecks = (prNumberOrBranch: number | string | undefined) => {
        // gh throws if there are failed checks
        // @TODO: this should be handled in a transformer function
        try {
            this.sysCallService.execInherit(`gh pr checks ${prNumberOrBranch ?? ''}`)
        } catch {
            // silently do nothing
        }
    }

    getRun = (runId: string | number) => {
        // @TODO: this should be handled in a transformer function
        try {
            const str = this.sysCallService.execPipe(
                `gh run view ${runId} --json name,url,jobs,conclusion,databaseId,event,number,displayTitle,status,workflowName,workflowDatabaseId`,
            )

            // @TODO: consider validating this
            return JSON.parse(str) as Run
        } catch (e) {
            Logger.debug(e)
            throw new Error(`Could not fetch run with id ${runId}`)
        }
    }

    checkout(branchOrPr: string, directory: string) {
        this.sysCallService.execInherit(`gh pr checkout ${branchOrPr}`, { cwd: directory })
    }

    private static instance: GithubRepository
    static init(...args: ConstructorParameters<typeof GithubRepository>) {
        if (this.instance) {
            Logger.warn(`${GithubRepository.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new GithubRepository(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${GithubRepository.name} not initialized`)
        return this.instance
    }
}
