import { execSync } from 'child_process'
import { Command } from 'commander'
import prompts from 'prompts'
import { assertGitHubInstalled, exec } from '../utils'

interface PR {
    number: number
    title: string
    url: string
    statusCheckRollup: Check[]
}
type Conclusion = 'SUCCESS' | 'FAILURE' | 'NEUTRAL'
type LowercaseConclusion = Lowercase<Conclusion>

type CheckRunStatus = 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED'
type LowercaseStatus = Lowercase<CheckRunStatus>

interface CheckRun {
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
const isCheckRun = (check: Check): check is CheckRun => check.__typename === 'CheckRun'

interface Run {
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

const getPr = (prNumberOrBranch: number | string | undefined): PR => {
    try {
        const jsonStr = execSync(
            `gh pr view ${prNumberOrBranch ?? ''} --json number,title,url,statusCheckRollup`,
        ).toString()
        return JSON.parse(jsonStr)
    } catch {
        process.exit(1)
    }
}

const getOpenPrs = (): PR[] => {
    const jsonStr = execSync(`gh pr list --json number,title,url,statusCheckRollup`).toString()
    return JSON.parse(jsonStr)
}
const filterFailedChecks = (pr: PR): PR => {
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
const getCheckTitleString = (check: Check) => {
    const isCheckRun_ = isCheckRun(check)

    const workflowName = (isCheckRun_ && check.workflowName ? check.workflowName + ' / ' : '').dim
    const name = isCheckRun_ ? check.name : check.context
    const conclusion = isCheckRun_ ? check.conclusion : check.state

    const status = isCheckRun_ && check.status
    const statusStr = status ? `[${status.yellow}]` : ''

    return `${statusString[conclusion || status]?.(workflowName + name) || `${statusStr} ${name}`}`
}

const displayChecks = (prs: PR[]) => {
    const prStrings = prs.map(pr => {
        const prTitle = `${('#' + pr.number).magenta} ${pr.title} ${pr.url.dim}`
        const checks = pr.statusCheckRollup.map(check => {
            const url = isCheckRun(check) ? check.detailsUrl : check.targetUrl
            return `    ${getCheckTitleString(check)}  ${url.dim}`
        })

        return `${prTitle} \n${checks.length ? checks.join('\n') : '    Nothing to see here'.dim}`
    })

    if (!prStrings.length) return console.log('No open PRs to display'.dim)

    console.log('\n' + prStrings.join('\n\n') + '\n')
}

const getCheckChoices = (prs: PR[]) =>
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
type UnwrapArray<T> = T extends (infer U)[] ? U : never
type ChoiceValue = UnwrapArray<ReturnType<typeof getCheckChoices>>['value']
type CheckRunChoiceValue = Extract<ChoiceValue, CheckRun>

const rerunChecks = async (prs: PR[], refetchPrs: () => PR[]) => {
    const checksChoices = getCheckChoices(prs)

    if (!checksChoices.length) return console.log('No failed checks to rerun'.dim)

    const { checksToRerun }: { checksToRerun?: CheckRunChoiceValue[] } = await prompts({
        type: 'autocompleteMultiselect',
        name: 'checksToRerun',
        message: 'Select checks to rerun',
        choices: checksChoices,
        instructions: false,
    })

    console.log(
        !checksToRerun?.length
            ? 'Not rerunning any checks'.dim
            : `Rerunning ${checksToRerun.length} checks...`.dim,
    )
    if (!checksToRerun?.length) return

    const getRun = (runId: string | number) => {
        try {
            const str = execSync(
                `gh run view ${runId} --json name,url,jobs,conclusion,databaseId,event,number,displayTitle,status,workflowName,workflowDatabaseId`,
            ).toString()
            return JSON.parse(str) as Run
        } catch {}
    }

    const getJobIdFromRun = (run: Run, jobName: string): number | undefined => {
        return run.jobs.find(job => job.name === jobName)?.databaseId
    }

    const getRunIdFromCheck = (check: CheckRun) => check.detailsUrl.match(/\d+/g)?.[0]

    const runIds = new Set(checksToRerun.map(check => getRunIdFromCheck(check)).filter(Boolean) as string[])

    const runsMap = new Map<string, Run>()
    runIds.forEach(runId => {
        const run = getRun(runId)
        if (run) runsMap.set(runId, run)
    })
    const processedRuns = new Set<string>()

    const getCommandFromCheck = async (check: CheckRun) => {
        const runId = getRunIdFromCheck(check)
        if (!runId) {
            console.log('Could not get runId from check detailsUrl'.red)
            return
        }
        if (processedRuns.has(runId)) return

        const run = runsMap.get(runId)
        if (!run) {
            console.log('Could not find run'.red)
            return
        }

        const jobId = getJobIdFromRun(run, check.name)
        if (!run) {
            console.log('Could not find job'.red)
            return
        }

        const failedJobs = run.jobs.filter(job => job.conclusion == 'failure')
        const selectedChecks = checksToRerun.filter(check => {
            const checkRunId = getRunIdFromCheck(check)
            if (!checkRunId) return false
            return checkRunId == runId
        })

        if (selectedChecks.length > 1) {
            console.log(
                `\nYou selected ${check.name.cyan} and ${selectedChecks.length - 1} other jobs in the run ${
                    run.workflowName.cyan
                }`,
            )
            console.log(
                `but we can only rerun ${'one specific'.underline} job in a workflow at a time, or rerun ${
                    'all failed'.red
                } jobs together.`,
            )

            if (failedJobs.length > 1) {
                const { runAllFailed } = await prompts({
                    type: 'confirm',
                    name: 'runAllFailed',
                    message: `Do you want to rerun ${(failedJobs.length + ' failed').red} jobs?`,
                })
                if (runAllFailed) {
                    const command = `gh run rerun ${runId} --failed`
                    processedRuns.add(runId)

                    return command
                }
            }

            console.log(
                `\nSince there ${
                    failedJobs.length == 1 ? 'is only one failed job' : 'are no failed jobs'
                } in this run, your only option is to
                `.yellow,
            )
            console.log(
                `  1. rerun ${check.name.cyan}
  2. wait for it to finish
  3. trigger the other job`,
            )
        }

        processedRuns.add(runId)
        const command = `gh run rerun --job ${jobId}`

        return command
    }

    for (const check of checksToRerun || []) {
        const command = await getCommandFromCheck(check)
        if (!command) continue
        console.log(
            `\nRerunning ${((check.workflowName + ' / ').dim + check.name).cyan} with \`${command}\`...`.dim,
        )

        try {
            exec(command)
        } catch {
            console.log(
                'Failed to rerun, this might be because there is already a running job in this workflow'.red,
            )
        }
    }

    console.log('\nRefetching checks...'.dim)
    setTimeout(() => displayChecks(refetchPrs()), 2000)
}

const checksHandler = (
    prNumberOrBranch: number | string | undefined,
    opts: { all?: boolean; failed?: boolean; rerun?: boolean },
) => {
    assertGitHubInstalled()

    const getPrs = () => {
        const prs: PR[] = []
        if (!opts.all || prNumberOrBranch) prs.push(getPr(prNumberOrBranch))
        else prs.push(...getOpenPrs())

        return prs
    }

    const prs = opts.failed ? getPrs().map(filterFailedChecks) : getPrs()

    if (opts.rerun) return rerunChecks(prs, getPrs)
    else return displayChecks(prs)
}

export const setupChecksCommand = (cli: Command) => {
    cli.command('checks')
        .description('Show checks for the current PR')
        .argument('[prNumberOrBranch]', 'PR number or branch name')
        .option('-a, --all', 'Show checks for all open PRs', false)
        .option('-f, --failed', 'Show only failed checks')
        .option('-r, --rerun', 'Select failed checks to rerun')
        .addHelpText(
            'after',
            '\n  -w, --watch       Not yet supported, please use gh directly with `gh pr checks --watch -i 5`',
        )
        .action(checksHandler)
}
