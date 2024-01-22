import { fuzzyMatch, getRelativePathOf } from '../../lib/utils'
import { Worktree } from './git.model'

export const fixBranchName = (branch: string) =>
    branch.replace('refs/', '').replace('heads/', '').replace('remotes/', '').replace('origin/', '')

export const getWorktreeDisplayStr = (tree: Worktree, isDirty?: boolean) => {
    const info = [
        tree.isCurrent ? 'current'.green : null,
        isDirty ? 'dirty'.red : null,
        tree.isLocked ? 'locked'.red : null,
        tree.isPrunable ? 'prunable'.cyan : null,
        tree.isMainWorktree ? 'main'.blue : '',
    ]
        .filter(Boolean)
        .join(', ')
    const checkedOut = tree.isBare
        ? '[bare]'.yellow
        : tree.isDetached
        ? tree.head?.yellow
        : tree.branch?.yellow

    return `${checkedOut} ${info ? `(${info}) ` : ''}${tree.directory.dim}`
}

/** Returns a folder name with incremented index (starting at 1) */
export const getNextWorktreeName = (worktrees: Worktree[]) => {
    const worktreesIndicies = worktrees
        .map(worktree => /worktree-\d+/.exec(worktree.directory)?.[0]?.match(/\d+/)?.[0])
        .filter(Boolean)
        .map(Number)
        .sort((a, b) => a - b)
    const nextIndex = (worktreesIndicies[worktreesIndicies.length - 1] || 0) + 1

    return `worktree-${nextIndex}`
}

export const getBranchWorktreeString = (worktrees: Worktree[], branch: string | undefined): string => {
    const checkedOutWorktree = worktrees.find(wt => wt.branch == branch)
    const pathToWorkTree = checkedOutWorktree ? getRelativePathOf(checkedOutWorktree.directory).dim : ''

    if (!checkedOutWorktree) return ''

    return ` ${'(checked out'.red} ${pathToWorkTree}${')'.red}`
}

export const getWorktreeFromBranch = (branch: string, worktrees: Worktree[]) => {
    const candidates = fuzzyMatch(worktrees, branch, wt => wt.branch || wt.head || '')
    // @TODO: If there are multiple candidates, we should prompt to select the correct one
    const worktree = candidates[0]

    if (!worktree) {
        throw new Error(`No worktree found for branch query '${branch.yellow}'`)
    }

    return worktree
}
