import prompts from 'prompts'
import { Worktree, getBranchWorktreeString } from '../../../adapters/git'
import { PullRequest } from '../../../adapters/github'
import { Logger } from '../../../lib/logger.service'

export const selectPullRequest = async (
    worktrees: Worktree[],
    pullRequests: PullRequest[],
): Promise<PullRequest | null> => {
    const { pullRequest }: { pullRequest?: PullRequest } = await prompts({
        type: 'select',
        name: 'pullRequest',
        message: 'Select a pull request to create a worktree from',
        choices: pullRequests.map(pr => {
            const checkedOutWorktreeString = getBranchWorktreeString(worktrees, pr.headRefName)

            return {
                title: `${('#' + pr.number).magenta} ${pr.title}${checkedOutWorktreeString}`,
                value: pr,
                disabled: !!checkedOutWorktreeString,
            }
        }),
        instructions: false,
    })

    if (!pullRequest) {
        Logger.getInstance().warn('No pull request selected'.red)
        return null
    }

    return pullRequest
}
