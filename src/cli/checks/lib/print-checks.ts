import { PullRequest, getCheckTitleString, isCheckRun } from '../../../adapters/github'
import { getPaddedStr, indent } from '../../../utils'

export const printChecks = (prs: PullRequest[]) => {
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
