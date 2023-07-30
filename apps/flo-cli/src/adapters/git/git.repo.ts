import { execSync } from 'child_process'
import path from 'path'
import { fixBranchName } from './git.utils'
import { Worktree } from './git.model'
import { Logger } from '../../lib/logger'
import { exec } from '../../lib/utils'

export const getBranches = (remote?: boolean) => {
    return execSync(`git branch ${remote ? '-r' : ''} --format "%(refname:short)"`)
        .toString()
        .split('\n')
        .filter(Boolean)
        .map(fixBranchName)
}

export const getCurrentBranch = (workingDir?: string) =>
    execSync('git branch --show-current', { cwd: workingDir }).toString().trim()

export const getGitStatus = (directory?: string) =>
    execSync((directory ? `cd ${directory} && ` : '') + 'git status --short')
        .toString()
        .trim()

export const getWorktrees = (): Worktree[] => {
    const output = execSync('git worktree list --porcelain').toString().trim()
    const worktreeTextBlocks = output.split('\n\n').filter(Boolean)
    const repoRootDir = getRepoRootDir()

    const worktrees = worktreeTextBlocks
        .map<Worktree>(block => {
            const dir = block.match(/(^worktree .+)/m)?.[0].replace('worktree ', '')
            const branch = block.match(/^branch .+/m)?.[0].replace('branch ', '')

            if (!dir) {
                console.log(`Couldn't match a directory in:\n${block}`.red)
                process.exit(1)
            }
            if (!branch) {
                console.log(`Couldn't match a branch name in:\n${block}`.red)
                process.exit(1)
            }

            return {
                dir,
                branch: fixBranchName(branch || ''),
                isMainWorktree: repoRootDir == dir,
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
        Logger.getInstance().warn(`No worktree found for branch ${branch}`.red)
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

export const getRemoteOf = (branch: string) => {
    try {
        return execSync(`git config --get branch.${branch}.remote`).toString().trim() || null
    } catch {
        return null
    }
}

/** `git branch <branchName>` */
export const createBranch = (
    branchName: string,
    message: string | null = `Creating branch ${branchName.green}...`.dim,
) => {
    if (message !== null) Logger.getInstance().log(message)
    exec(`git branch ${branchName}`)
}

export const deleteBranch = (
    branchName: string,
    loggerMessage: string | null = `Deleted branch ${branchName}`,
) => {
    execSync(`git branch -d ${branchName}`)
    if (loggerMessage !== null) Logger.getInstance().verbose(loggerMessage)
}

export const gitFetch = (upstream?: string) => {
    Logger.getInstance().verbose(`\nFetching${upstream ? ' from upstream ' + upstream.magenta : ''}...`)
    exec(`git fetch ${upstream}`)
}

export const gitPull = (upstream?: string, workingDir?: string) => {
    const upstreamText = upstream ? ' from ' + upstream.magenta : ''
    try {
        Logger.getInstance().verbose(`\nPulling${upstreamText}...`.dim)
        exec(`git pull ${upstream || ''}`, workingDir)
    } catch {
        Logger.getInstance().error(`Failed to pull${upstreamText}`.red)
    }
}

export const gitCheckout = (branchName: string, workingDir?: string) => {
    Logger.getInstance().log()
    return execSync(`git checkout ${branchName}`, { cwd: workingDir }).toString()
}
