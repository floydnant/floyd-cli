import { execSync } from 'child_process'
import path from 'path'
import { fixBranchName } from './git.util'

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

export const getWorktrees = () => {
    const output = execSync('git worktree list --porcelain').toString()
    const worktrees = output
        .split('\n\n')
        .map(block => {
            const dir = block.match(/(^worktree .+)/m)?.[0].replace('worktree ', '')
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
    const joined = path.join(process.cwd(), gitDir)
    const resolved = (isAbsolute ? gitDir : joined).replace(/\/\.git.*/, '')

    return resolved
}
