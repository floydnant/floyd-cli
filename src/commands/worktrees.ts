import { Command } from 'commander'
import path from 'path'
import prompts from 'prompts'
import {
    getBranches,
    getWorktrees,
    getWorktreeDisplayStr,
    getBranchStatus,
    getWorktreeFromBranch,
    Worktree,
    getCommitLogs,
    getRepoRootDir,
} from '../git'
import { getOpenPrs, getPr } from '../github'
import { exec, getPaddedStr, indent, openWithVscode } from '../utils'

export const selectWorktrees = async (
    worktrees = getWorktrees(),
    opts?: { message?: string; multiple?: boolean },
): Promise<Worktree[] | null> => {
    const multiple = opts?.multiple ?? true
    const defaultMessage = multiple ? 'Select worktrees' : 'Select a worktree'
    const message = opts?.message || defaultMessage

    const { trees }: { trees?: Worktree[] | Worktree } = await prompts({
        type: multiple ? 'autocompleteMultiselect' : 'autocomplete',
        name: 'trees',
        message: message || defaultMessage,
        choices: worktrees.map(tree => ({
            title: getWorktreeDisplayStr(tree, !!getBranchStatus(tree.dir)),
            value: tree,
        })),
        instructions: false,
    })
    const trees_ = [trees].flat().filter(Boolean) as Worktree[]

    if (!trees_?.length) {
        console.log(multiple ? 'No worktrees selected' : 'No worktree selected')
        return null
    }
    return trees_
}

const createWorktree = async (
    branch_: string | undefined,
    opts: {
        originBranch?: boolean | string
        remote?: string
        pullRequest?: boolean | string
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

    const machine = {
        open: () => openWithVscode(worktreePath),
        'open-reuse': () => openWithVscode(worktreePath, { reuse: true }),
        change: () => process.chdir(worktreePath), // @FIXME: seems like we cannot change the cwd of the parent process
        nothing: () => {},
    }

    const { next }: { next: keyof typeof machine } = await prompts({
        type: 'autocomplete',
        name: 'next',
        message: 'What next?',
        choices: [
            { title: 'Open worktree in VSCode', value: 'open' },
            { title: 'Open worktree in VSCode (reuse window)', value: 'open-reuse' },
            { title: 'Change directory (@TODO)', value: 'change' },
            { title: 'Nothing', value: 'nothing' },
        ],
        instructions: false,
    })
    machine[next]()
}

const switchWorktree = async (branch: string | undefined, opts: { newWindow?: boolean }) => {
    const openOpts = { reuse: !opts.newWindow }
    const worktrees = getWorktrees()

    if (branch) {
        const worktree = getWorktreeFromBranch(branch, worktrees)
        openWithVscode(worktree.dir, openOpts)
        return
    }

    const selectedWorktrees = await selectWorktrees(worktrees, { multiple: false })
    if (!selectedWorktrees?.length) return

    openWithVscode(selectedWorktrees[0].dir, openOpts)
}

const deleteWorktree = async (
    branch: string | undefined,
    opts: { force?: boolean; deleteBranch?: boolean; forceDeleteBranch?: boolean },
) => {
    const worktrees = getWorktrees()

    if (branch) {
        const worktree = getWorktreeFromBranch(branch, worktrees)
        if (worktree.isMainWorktree) {
            console.log(`Cannot remove the main worktree in ${worktree.dir}`.red)
            process.exit(1)
        }

        const { confirmed } = await prompts({
            type: 'confirm',
            name: 'confirmed',
            message: 'Remove'.red + ` the worktree ${worktree.branch.green} in ${worktree.dir.dim}?`,
        })
        if (!confirmed) return

        exec(`git worktree remove ${opts.force ? '-f' : ''} ${worktree.dir}`)

        const optsDelete = (opts.deleteBranch || opts.forceDeleteBranch) && { deleteBranch: true }
        const { deleteBranch } =
            optsDelete ||
            (await prompts({
                type: 'confirm',
                name: 'deleteBranch',
                message: 'Delete'.red + ` the branch ${worktree.branch.green} too?`,
            }))
        if (!deleteBranch) return

        try {
            exec(`git branch ${opts.forceDeleteBranch ? '-D' : '-d'} ${worktree.branch}`)
        } catch {}
        return
    }

    const removeableWorktrees = worktrees.filter(tree => !tree.isMainWorktree)
    if (!removeableWorktrees.length) {
        console.log('No worktrees to remove')
        return
    }

    const selectedTrees = (await selectWorktrees(removeableWorktrees, {
        message: 'Select worktrees to remove',
    })) as Worktree[] | null
    if (!selectedTrees?.length) return

    const { deleteBranches } = await prompts({
        type: 'confirm',
        name: 'deleteBranches',
        message:
            'Delete'.red + ` the branches ${selectedTrees.map(tree => tree.branch.green).join(', ')} too?`,
    })
    selectedTrees.forEach(tree => {
        console.log(`Removing worktree ${tree.dir.yellow}...`.dim)
        exec(`git worktree remove ${tree.dir}`)
        if (deleteBranches) {
            try {
                exec(`git branch ${opts.forceDeleteBranch ? '-D' : '-d'} ${tree.branch}`)
            } catch {}
        }
    })
}

const listWorktrees = (opts: { logs?: boolean | string }) => {
    const worktrees = getWorktrees()
        .map(tree => {
            const worktreeStr = getWorktreeDisplayStr(tree)

            const status = getBranchStatus(tree.dir)
            const statusDisplay = !status ? ' Clean'.dim : status

            const logLimit = isNaN(parseInt(opts.logs as string)) ? 5 : (opts.logs as unknown as number)
            const commits = opts.logs ? '\n\n' + getCommitLogs(tree.dir, logLimit) : ''

            return `${getPaddedStr(worktreeStr)}\n${indent(statusDisplay, 3)}${indent(commits)}`
        })
        .join('\n\n')
    console.log('\n' + worktrees + '\n')
}

export const setupWorktreeCommand = (cli: Command) => {
    const switchCommand = cli
        .createCommand('switch')
        .alias('sw')
        .description('Switch to another worktree')
        .argument('[branch]', 'the branch to switch the worktree to')
        .option('-n, --newWindow', 'do not reuse vscode window', false)
        .action(switchWorktree)

    const createWorktreeCommand = cli
        .createCommand('create')
        .alias('c')
        .description('Switch to another worktree')
        .description('Create a worktree with a new or existing branch')
        .argument('[branch]', 'new or existing branch to create the worktree for')
        .option('-o, --originBranch [origin branch]', 'create a worktree from an origin branch')
        // @TODO: Add an option to specify a custom directory
        .option('-O, --remote <remote>', 'which remote to fetch from')
        .option('-p, --pullRequest [number]', 'create a worktree from a pull request')
        .action(createWorktree)

    const deleteWorktreeCommand = cli
        .createCommand('delete')
        .alias('d')
        .description('Delete a worktree')
        .argument('[branch]', 'the branch related to the worktree')
        .option('-f, --force', 'force removal even if worktree is dirty or locked')
        .option('-d, --deleteBranch', 'delete the related branch')
        .option('-D, --forceDeleteBranch', 'force delete the related branch')
        .action(deleteWorktree)

    const listWorktreesCommand = cli
        .createCommand('list')
        .alias('ls')
        .description('List worktrees')
        .option('-l, --logs [number]', 'Show recent commit logs')
        .action(listWorktrees)

    // @TODO: Add a command to rename a worktree to the current branch name

    cli.command('worktree')
        .alias('tr')
        .description('Manage git worktrees')
        .addCommand(switchCommand)
        .addCommand(createWorktreeCommand)
        .addCommand(deleteWorktreeCommand)
        .addCommand(listWorktreesCommand, { isDefault: true })
}
