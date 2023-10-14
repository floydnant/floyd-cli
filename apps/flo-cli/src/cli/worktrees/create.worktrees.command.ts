import '@total-typescript/ts-reset'
import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'
import { GitRepository } from '../../adapters/git'
import { getOpenPullRequests, getPullRequest } from '../../adapters/github'
import { ConfigService } from '../../lib/config/config.service'
import { ExecutionService } from '../../lib/exec.service'
import { Logger } from '../../lib/logger.service'
import { OpenService } from '../../lib/open/open.service'
import { OpenType } from '../../lib/open/open.types'
import { assertGitHubInstalled } from '../../lib/utils'
import { resolveWorkflow } from '../../lib/workflows/resolve-workflow'
import { runWorkflow } from '../../lib/workflows/run-workflow'
import { selectBranch } from '../../lib/worktrees/select-branch'
import { selectPullRequest } from '../../lib/worktrees/select-pull-request'
import { setupWorktree } from '../../lib/worktrees/setup-worktree'
import { WorktreeHook } from '../../lib/worktrees/worktree-config.schemas'
import { getWorktreeHook } from '../../lib/worktrees/worktree-hooks'

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
    const gitRepo = GitRepository.getInstance()
    const configService = ConfigService.getInstance()
    const openService = new OpenService(ExecutionService.getInstance()).useFirst(OpenType.Vscode)

    const worktrees = gitRepo.getWorktrees()
    const useRemoteBranches = !!opts.upstreamBranch || !!opts.pullRequest
    const branches = gitRepo.getBranches(useRemoteBranches)

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
        Logger.verbose(`\nFound pull request ${('#' + pr.number).magenta} ${pr.title}`.dim)
    }

    branchingScope: if (!branch) {
        const branchSelection = await selectBranch({
            message: `Select a${useRemoteBranches ? ' remote' : ''} branch to create a worktree from`,
            branches,
            worktrees,
            allowNewBranch: !useRemoteBranches,
        })

        if (!branchSelection) {
            Logger.warn('No branch selected'.red)
            process.exit(1)
        }

        if ('existing' in branchSelection) {
            branch = branchSelection.existing
            break branchingScope
        }

        branch = branchSelection.new

        gitRepo.createBranch(branch)
    }
    if (!branch) return

    const checkedOutWorktree = worktrees.find(worktree => worktree.branch == branch)
    if (checkedOutWorktree) {
        Logger.error(
            `The branch ${branch.green} is already checked out in `.red + checkedOutWorktree.directory.yellow,
        )
        process.exit(1)
    }

    // const upstream = !useRemoteBranches ? '' : (opts.remote || getRemoteOf(branch) || 'origin') + ' ' + branch

    if (useRemoteBranches) gitRepo.gitFetch()
    // create branch if it doesn't exist yet
    else if (!gitRepo.getBranches().includes(branch)) {
        Logger.log(`\nBranch ${branch.green} does not exist yet, creating it for you now...`.dim)
        gitRepo.createBranch(branch, null)
    }

    const worktree = setupWorktree({
        ...opts,
        existingWorktrees: worktrees,
        worktreeName: opts.useBranch ? branch : undefined,
        branchToCheckout: branch,
    })

    const workflow = getWorktreeHook(WorktreeHook.OnCreate)
    configService.contextVariables.newWorktreeRoot = worktree.directory
    if (workflow) await runWorkflow(resolveWorkflow(workflow))

    Logger.log()
    const folderPath = path.join(worktree.directory, opts.subDir || '')
    const { next }: { next?: () => void } = await prompts({
        type: 'select',
        name: 'next',
        message: 'Your worktree is ready! What next?',
        choices: [
            openService.isReuseWindowSupported && {
                title: `Open worktree in ${openService.name} (reuse window)`,
                value: () => openService.open(folderPath, { reuseWindow: true }),
            },
            {
                title: `Open worktree in ${openService.name}`,
                value: () => openService.open(folderPath),
            },
            { title: 'Do nothing', value: () => undefined, description: 'suit yourself then' },
        ].filter(Boolean),
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
    // @TODO: @floydnant there should be a `skip-hooks` option
    .option(`--ub, --use-branch`, 'use branch name as directory for the worktree', false)
    .option('-r, --remote <remote>', 'which remote to fetch from')
    .option('--pr, --pull-request [number]', 'create a worktree from a pull request')
    .option('-s, --sub-dir <path>', 'switch directly into a subdirectory of the repo when opening vscode')
    .action(
        (
            branch: string | undefined,
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
        ) => createWorktree(branch, opts),
    )
