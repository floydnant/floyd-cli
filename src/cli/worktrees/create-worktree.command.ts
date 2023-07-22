import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'
import { getBranches, getRepoRootDir, getWorktrees } from '../../adapters/git'
import { getOpenPrs, getPr } from '../../adapters/github'
import { exec, openWithVscode } from '../../utils'

const createWorktree = async (
    branch_: string | undefined,
    opts: {
        originBranch?: boolean | string
        remote?: string
        pullRequest?: boolean | string
        subDir?: string
    },
) => {
    const worktrees = getWorktrees()
    let branch = typeof opts.originBranch == 'string' ? opts.originBranch : branch_

    if (opts.pullRequest) {
        let prBranch: string
        if (typeof opts.pullRequest == 'boolean') {
            const prs = getOpenPrs({ checks: false })

            const { pr } = await prompts({
                type: 'autocomplete',
                name: 'pr',
                message: 'Select a pull request to create a worktree from',
                choices: prs.map(pr => {
                    const isCheckedOut = worktrees.some(wt => wt.branch == pr.headRefName)
                    return {
                        title: `${('#' + pr.number).magenta} ${pr.title}${
                            isCheckedOut ? ' (checked out)'.red : ''
                        }`,
                        value: pr,
                        disabled: isCheckedOut,
                    }
                }),
                instructions: false,
            })
            prBranch = pr.headRefName
        } else {
            const pr = getPr(opts.pullRequest, { checks: false })
            console.log(`Found pull request ${('#' + pr.number).magenta} ${pr.title}`.dim)

            prBranch = pr.headRefName
            const checkedOutInWorktree = worktrees.find(wt => wt.branch == prBranch)
            if (checkedOutInWorktree) {
                console.log(
                    `But the branch ${prBranch} is already checked out in `.red +
                        checkedOutInWorktree.dir.yellow,
                )
                return
            }
        }
        branch = prBranch
        opts.originBranch = true

        if (!prBranch) console.log('No branch found for pull request'.red)
    }

    if (!branch) {
        const branches = getBranches(!!opts.originBranch)

        const choiceCreate = opts.originBranch
            ? []
            : [{ title: '** Create new branch **'.magenta, value: '*new*' }]

        const { selectedBranch } = await prompts({
            type: 'autocomplete',
            name: 'selectedBranch',
            message: `Select ${opts.originBranch ? 'an origin' : 'a'} branch to create a worktree from`,
            choices: [
                ...choiceCreate,
                ...branches.map(branch => {
                    const isCheckedOut = worktrees.some(wt => wt.branch == branch)
                    return {
                        title: `${branch}${isCheckedOut ? ' (checked out)'.red : ''}`,
                        value: branch,
                        disabled: isCheckedOut,
                    }
                }),
            ],
            instructions: false,
        })

        if (selectedBranch != '*new*') branch = selectedBranch
        else {
            const { newBranch } = await prompts({
                type: 'text',
                name: 'newBranch',
                message: 'Enter a new branch name',
                validate: value => (branches.includes(value) ? 'Branch name already exists' : true),
            })

            if (newBranch) branch = newBranch
            else return
        }
    }
    if (!branch) return

    const checkedOutInWorktree = worktrees.find(wt => wt.branch == branch)
    if (checkedOutInWorktree) {
        console.log(`The branch ${branch} is already checked out in `.red + checkedOutInWorktree.dir.yellow)
        return
    }

    const repoRootDir = getRepoRootDir()
    const worktreePath = path.join(repoRootDir, '../', path.basename(repoRootDir) + '.worktrees/', branch)

    if (opts.originBranch) exec(`git fetch ${opts.remote || 'origin'} ${branch}`)

    console.log(`Creating worktree in ${worktreePath.yellow}...`.dim)
    exec(`git worktree add -B ${branch} ${worktreePath}`)

    const folderPath = path.join(worktreePath, opts.subDir || '')

    const { next }: { next: () => void } = await prompts({
        type: 'autocomplete',
        name: 'next',
        message: 'What next?',
        choices: [
            { title: 'Open worktree in VSCode', value: () => openWithVscode(folderPath) },
            {
                title: 'Open worktree in VSCode (reuse window)',
                value: () => openWithVscode(folderPath, { reuse: true }),
            },
            { title: 'Nothing', value: () => {} },
        ],
        instructions: false,
    })
    next()
}

export const createWorktreeCommand = new Command()
    .createCommand('create')
    .alias('c')
    .description('Switch to another worktree')
    .description('Create a worktree with a new or existing branch')
    .argument('[branch]', 'new or existing branch to create the worktree for')
    .option('-o, --originBranch [origin branch]', 'create a worktree from an origin branch')
    // @TODO: Add an option to specify a custom directory
    .option('-O, --remote <remote>', 'which remote to fetch from')
    // @TODO: Fix creating worktrees from pull requests (seems broken)
    .option('-p, --pullRequest [number]', 'create a worktree from a pull request')
    .option('-s, --subDir <path>', 'switch directly into a subdirectory of the repo when opening vscode')
    .action(createWorktree)
