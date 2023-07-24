import { isSubDir } from '../../lib/utils'
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
