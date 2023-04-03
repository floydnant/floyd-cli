import { execSync } from 'child_process'
import path from 'path'
import { getWorkingDir, isSubDir, UnwrapArray } from './utils'

export const getBranches = (remote?: boolean) => {
    return execSync(`git branch ${remote ? '-r' : ''} --format "%(refname:short)"`)
        .toString()
        .split('\n')
        .filter(Boolean)
        .map(fixBranchName)
}

export const getBranchStatus = (dir?: string) =>
    execSync((dir ? `cd ${dir} && ` : '') + 'git status --short')
        .toString()
        .trim()

export const fixBranchName = (branch: string) =>
    branch.replace('refs/', '').replace('heads/', '').replace('remotes/', '').replace('origin/', '')

export type Worktree = UnwrapArray<ReturnType<typeof getWorktrees>>
export const getWorktrees = () => {
    const output = execSync('git worktree list --porcelain').toString()
    const worktrees = output
        .split('\n\n')
        .map(block => {
            const dir = block.match(/(^worktree .+)/m)?.[0].replace('worktree ', '')!
            const branch = block.match(/^branch .+/m)?.[0].replace('branch ', '')
            return {
                dir,
                branch: fixBranchName(branch || ''),
                isMainWorktree: !dir?.includes('.worktrees'),
            }
        })
        .filter(wt => !!wt.dir)
    return worktrees
}

export const getWorktreeDisplayStr = (tree: Worktree, isDirty?: boolean) => {
    const currentWorkingDir = getWorkingDir()
    const isCurrentTree =
        currentWorkingDir == tree.dir || isSubDir(currentWorkingDir, tree.dir) ? '(current) '.yellow : ''
    const isDirtyStr = isDirty ? '(dirty) ' : ''

    const branch = tree.branch.green
    const isMainWorktree = tree.isMainWorktree ? ' (main)'.blue : ''
    return `${branch} ${isCurrentTree}${isDirtyStr}${tree.dir.dim}${isMainWorktree}`
}

export const getWorktreeFromBranch = (branch: string, worktrees = getWorktrees()) => {
    const worktree = worktrees.find(tree => {
        return tree.branch == branch || tree.branch == fixBranchName(branch)
    })
    if (!worktree) {
        console.log(`No worktree found for branch ${branch}`.red)
        process.exit(1)
    }

    return worktree
}

export const getCommitLogs = (dir?: string, limit?: number) => {
    const cmd = `git log --oneline --graph --decorate --color ${limit ? '-n ' + limit : ''}`
    return execSync((dir ? `cd ${dir} && ` : '') + cmd).toString()
}

export const getRepoRootDir = () => {
    const gitDir = execSync('git rev-parse --git-dir').toString().trim()
    const isAbsolute = path.isAbsolute(gitDir)
    const joined = path.join(getWorkingDir(), gitDir)
    const resolved = (isAbsolute ? gitDir : joined).replace(/\/\.git.*/, '')

    return resolved
}
