import prompts from 'prompts'
import {
    CheckRun,
    PrCheckRun,
    PullRequestWithChecks,
    Run,
    getJobIdFromRun,
    getRun,
    getRunIdFromCheck,
} from '../../../adapters/github'
import { getCheckChoices } from './check-choices'
import { printChecks } from './print-checks'
import { SysCallService } from '../../../lib/sys-call.service'

export const rerunChecks = async (
    prs: PullRequestWithChecks[],
    refetchPrs: () => PullRequestWithChecks[],
) => {
    const sysCallService = SysCallService.getInstance()

    const checksChoices = getCheckChoices(prs)

    if (!checksChoices.length) return console.log('No failed checks to rerun'.dim)

    const { checksToRerun }: { checksToRerun?: PrCheckRun[] } = await prompts({
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
            sysCallService.execInherit(command)
        } catch {
            console.log(
                'Failed to rerun, this might be because there is already a running job in this workflow'.red,
            )
        }
    }

    console.log('\nRefetching checks...'.dim)
    setTimeout(() => printChecks(refetchPrs()), 2000)
}
