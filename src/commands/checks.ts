import { execSync } from 'child_process'
import { Command } from 'commander'
import prompts from 'prompts'
import { assertGitHubInstalled, exec, getPaddedStr, indent, UnwrapArray } from '../utils'
import {
    PR,
    isCheckRun,
    getCheckTitleString,
    CheckRun,
    Run,
    getPr,
    getOpenPrs,
    filterFailedChecks,
} from '../github'

const displayChecks = (prs: PR[]) => {
    if (!prs.length) return console.log('No open PRs to display'.dim)

    const prStrings = prs.map(pr => {
        const prTitle = `${('#' + pr.number).magenta} ${pr.title} ${pr.url.dim}`

        const checks = pr.statusCheckRollup.map(check => {
            const url = isCheckRun(check) ? check.detailsUrl : check.targetUrl
            return `${getCheckTitleString(check)}  ${url.dim}`
        })
        const checksStr = checks.length ? checks.join('\n') : 'Nothing to see here'.dim

        return `${getPaddedStr(prTitle)}\n${indent(checksStr)}`
    })

    const sum = {
        successful: 0,
        neutral: 0,
        failed: 0,
        pending: 0,
        queued: 0,
    }
    prs.forEach(pr => {
        pr.statusCheckRollup.forEach(check => {
            const isCheckRun_ = isCheckRun(check)
            const conclusion = isCheckRun_ ? check.conclusion : check.state
            if (conclusion == 'SUCCESS') sum.successful++
            else if (conclusion == 'NEUTRAL') sum.neutral++
            else if (conclusion == 'FAILURE') sum.failed++
            else if (isCheckRun_ && check.status == 'IN_PROGRESS') sum.pending++
            else if (isCheckRun_ && check.status == 'QUEUED') sum.queued++
        })
    })

    const successful = `${sum.successful} successful`.green
    const neutral = `${sum.neutral} neutral`
    const failed = `${sum.failed} failed`.red
    const pending = `${sum.pending} pending`.yellow
    const queued = `${sum.queued} queued`.yellow

    console.log(
        `In ${prStrings.length} PRs, are ${successful}, ${failed}, ${neutral}, ${pending}, and ${queued} checks`,
    )
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
        .aliases(['ch', 'check'])
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
