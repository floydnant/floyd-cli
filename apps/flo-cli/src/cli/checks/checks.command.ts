import { Command } from 'commander'
import {
    PullRequestWithChecks,
    filterFailedChecks,
    getOpenPullRequests,
    getPullRequest,
} from '../../adapters/github'
import { assertGitHubInstalled } from '../../lib/utils'
import { printChecks } from './lib/print-checks'
import { rerunChecks } from './lib/rerun-checks'

const checksHandler = (
    prNumberOrBranch: number | string | undefined,
    opts: { all?: boolean; failed?: boolean; rerun?: boolean },
) => {
    assertGitHubInstalled()

    const getPrs = (): PullRequestWithChecks[] => {
        return !opts.all || prNumberOrBranch
            ? [getPullRequest(prNumberOrBranch, { checks: true })]
            : getOpenPullRequests({ checks: true })
    }

    const prs = opts.failed ? getPrs().map(filterFailedChecks) : getPrs()

    if (opts.rerun) return rerunChecks(prs, getPrs)
    else return printChecks(prs)
}

export const checksCommand = new Command()
    .createCommand('checks')
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
