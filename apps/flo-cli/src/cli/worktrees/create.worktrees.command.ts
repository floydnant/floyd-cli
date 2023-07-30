import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'
import { createBranch, getBranches, getWorktrees, gitFetch } from '../../adapters/git'
import { getOpenPullRequests, getPullRequest } from '../../adapters/github'
import { Logger } from '../../lib/logger'
import { assertGitHubInstalled, openWithVscode } from '../../lib/utils'
import { selectBranch } from './lib/select-branch'
import { selectPullRequest } from './lib/select-pull-request'
import { setupWorktree } from './lib/setup-worktree'

const createWorktree = async (
    branch_: string | undefined,
    opts: {
        upstreamBranch?: boolean | string
        remote?: string
        pullRequest?: boolean | string
        subDir?: string
        directory?: string
        useBranch: boolean
        /** wether to stick the name of the repo in front of the new worktree's directory */
        worktreePrefix: boolean
    },
) => {
    const logger = Logger.getInstance()
    const worktrees = getWorktrees()
    const useRemoteBranches = !!opts.upstreamBranch || !!opts.pullRequest
    const branches = getBranches(useRemoteBranches)

    let branch = typeof opts.upstreamBranch == 'string' ? opts.upstreamBranch : branch_

    pullRequestsScope: if (opts.pullRequest) {
        assertGitHubInstalled()

        if (typeof opts.pullRequest == 'boolean') {
            const pullRequest = await selectPullRequest(worktrees, getOpenPullRequests())
            if (!pullRequest) process.exit(1)

            branch = pullRequest.headRefName
            break pullRequestsScope
        }

        const pr = getPullRequest(opts.pullRequest)
        branch = pr.headRefName
        logger.verbose(`\nFound pull request ${('#' + pr.number).magenta} ${pr.title}`.dim)
    }

    branchingScope: if (!branch) {
        const branchSelection = await selectBranch({
            message: `Select a${useRemoteBranches ? ' remote' : ''} branch to create a worktree from`,
            branches,
            worktrees,
            allowNewBranch: !useRemoteBranches,
        })

        if (!branchSelection) {
            logger.warn('No branch selected'.red)
            process.exit(1)
        }

        if ('existing' in branchSelection) {
            branch = branchSelection.existing
            break branchingScope
        }

        branch = branchSelection.new

        createBranch(branch)
    }
    if (!branch) return

    const checkedOutWorktree = worktrees.find(worktree => worktree.branch == branch)
    if (checkedOutWorktree) {
        logger.error(
            `The branch ${branch.green} is already checked out in `.red + checkedOutWorktree.dir.yellow,
        )
        process.exit(1)
    }

    // const upstream = !useRemoteBranches ? '' : (opts.remote || getRemoteOf(branch) || 'origin') + ' ' + branch

    if (useRemoteBranches) gitFetch()
    // create branch if it doesn't exist yet
    else if (!getBranches().includes(branch)) {
        logger.log(`\nBranch ${branch.green} does not exists yet, creating it for you now...`.dim)
        createBranch(branch, null)
    }

    const worktree = setupWorktree({
        ...opts,
        existingWorktrees: worktrees,
        worktreeName: opts.useBranch ? branch : undefined,
        branchToCheckout: branch,
    })

    logger.log()
    const folderPath = path.join(worktree.dir, opts.subDir || '')
    const { next }: { next?: () => void } = await prompts({
        type: 'select',
        name: 'next',
        message: 'What next?',

        choices: [
            {
                title: 'Open worktree in VSCode (reuse window)',
                value: () => openWithVscode(folderPath, { reuse: true }),
            },
            {
                title: 'Open worktree in VSCode (new window)',
                value: () => openWithVscode(folderPath),
            },
            { title: 'Do nothing', value: () => undefined, description: 'suit yourself then' },
        ],
        instructions: false,
    })

    next?.()
}

export const createWorktreeCommand = new Command()
    .createCommand('create')
    .alias('c')
    .description('Create a worktree with a new or existing branch')
    .argument('[branch]', 'new or existing branch to create the worktree for')
    .option(
        `-P, --no-worktree-prefix`,
        "wether to stick the name of the repo in front of the new worktree's directory",
    )
    .option('-u, --upstream-branch [upstream branch]', 'create a worktree from an upstream branch')
    .option(
        `--dir, --directory <path>`,
        'create the worktree in a custom directory (will take precedence over --use-branch)',
    )
    .option(`--ub, --use-branch`, 'use branch name as directory for the worktree', false)
    .option('-r, --remote <remote>', 'which remote to fetch from')
    .option('--pr, --pull-request [number]', 'create a worktree from a pull request')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo when opening vscode')
    .action(createWorktree)
