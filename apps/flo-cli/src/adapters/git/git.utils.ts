import { getRelativePathOf, isSubDir } from '../../lib/utils'
import { Worktree } from './git.model'

export const fixBranchName = (branch: string) =>
    branch.replace('refs/', '').replace('heads/', '').replace('remotes/', '').replace('origin/', '')

export const getWorktreeDisplayStr = (tree: Worktree, isDirty?: boolean) => {
    const currentWorkingDir = process.cwd()
    const isCurrentTree =
        currentWorkingDir == tree.dir || isSubDir(currentWorkingDir, tree.dir) ? '(current) '.yellow : ''
    const isDirtyStr = isDirty ? '(dirty) ' : ''

    const branch = tree.branch.green
    const isMainWorktree = tree.isMainWorktree ? ' (main)'.blue : ''
    return `${branch} ${isCurrentTree}${isDirtyStr}${tree.dir.dim}${isMainWorktree}`
}

export const getNextWorktreeName = (worktrees: Worktree[]) => {
    const worktreesIndicies = worktrees
        .map(worktree => /worktree-\d+/.exec(worktree.dir)?.[0]?.match(/\d+/)?.[0])
        .filter(Boolean)
        .map(Number)
        .sort((a, b) => a - b)
    const nextIndex = (worktreesIndicies[worktreesIndicies.length - 1] || 0) + 1

    return `worktree-${nextIndex}`
}

export const getBranchWorktreeString = (worktrees: Worktree[], branch: string | undefined): string => {
    const checkedOutWorktree = worktrees.find(wt => wt.branch == branch)
    const pathToWorkTree = checkedOutWorktree ? getRelativePathOf(checkedOutWorktree.dir).dim : ''

    if (!checkedOutWorktree) return ''

    return ` ${'(checked out'.red} ${pathToWorkTree}${')'.red}`
}
