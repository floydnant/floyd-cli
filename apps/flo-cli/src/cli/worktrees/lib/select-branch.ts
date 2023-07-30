import prompts from 'prompts'
import { Worktree, getBranchWorktreeString, getCurrentBranch } from '../../../adapters/git'

const enterNewBranchName = async (existingBranches: string[], currentBranch: string) => {
    const { newBranch }: { newBranch?: string } = await prompts({
        type: 'text',
        name: 'newBranch',
        message: `Enter a new branch name (branch off of ${currentBranch.green})`,
        validate: newBranch => (existingBranches.includes(newBranch) ? 'Branch name already exists' : true),
    })

    if (!newBranch?.trim()?.length) return null

    return newBranch.trim().replace(/\s/g, '-')
}

interface SelectBranchOptions {
    message: string
    branches: string[]
    worktrees: Worktree[]
    currentBranch?: string
    allowNewBranch?: boolean
}

type SelectBranchResult = Promise<{ existing: string } | { new: string } | null>

export const selectBranch = async ({
    message,
    branches,
    worktrees,
    currentBranch,
    allowNewBranch = true,
}: SelectBranchOptions): SelectBranchResult => {
    const CHOICE_NEW = '*new*'
    const choiceCreate = !allowNewBranch
        ? []
        : [{ title: '** Create new branch **'.green, value: CHOICE_NEW }]

    const { selectedBranch }: { selectedBranch?: string } = await prompts({
        type: 'select',
        name: 'selectedBranch',
        message,
        choices: [
            ...choiceCreate,
            ...branches.map(branch => {
                const checkedOutWorktreeString = getBranchWorktreeString(worktrees, branch)

                return {
                    title: `${branch}${checkedOutWorktreeString}`,
                    value: branch,
                    disabled: !!checkedOutWorktreeString,
                }
            }),
        ],
        instructions: false,
    })
    if (!selectedBranch) return null

    if (selectedBranch != CHOICE_NEW) return { existing: selectedBranch }

    const newBranchName = await enterNewBranchName(branches, currentBranch || getCurrentBranch())
    if (!newBranchName) return null

    return { new: newBranchName }
}
