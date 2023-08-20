import { execSync } from 'child_process'
import path from 'path'
import { fixBranchName } from './git.utils'
import { Worktree } from './git.model'
import { Logger } from '../../lib/logger.service'
import { exec, isSubDir } from '../../lib/utils'
import { z } from 'zod'

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

// Git Worktree List Output Format
//
// Porcelain Format
// The porcelain format has a line per attribute. If -z is given then the lines are terminated with NUL rather than a newline. Attributes are
// listed with a label and value separated by a single space. Boolean attributes (like bare and detached) are listed as a label only, and are
// present only if the value is true. Some attributes (like locked) can be listed as a label only or with a value depending upon whether a reason
// is available. The first attribute of a worktree is always worktree, an empty line indicates the end of the record. For example:
//
//     $ git worktree list --porcelain
//     worktree /path/to/bare-source
//     bare
//
//     worktree /path/to/linked-worktree
//     HEAD abcd1234abcd1234abcd1234abcd1234abcd1234
//     branch refs/heads/master
//
//     worktree /path/to/other-linked-worktree
//     HEAD 1234abc1234abc1234abc1234abc1234abc1234a
//     detached
//
//     worktree /path/to/linked-worktree-locked-no-reason
//     HEAD 5678abc5678abc5678abc5678abc5678abc5678c
//     branch refs/heads/locked-no-reason
//     locked
//
//     worktree /path/to/linked-worktree-locked-with-reason
//     HEAD 3456def3456def3456def3456def3456def3456b
//     branch refs/heads/locked-with-reason
//     locked reason why is locked
//
//     worktree /path/to/linked-worktree-prunable
//     HEAD 1233def1234def1234def1234def1234def1234b
//     detached
//     prunable gitdir file points to non-existent location

const handleGitErrors = <TArgs extends unknown[], TReturn, TFallback>(
    options: { fallbackValue: TFallback },
    callback: (...args: TArgs) => TReturn,
) => {
    return (...args: TArgs) => {
        try {
            // @TODO: @floydnant lets see, not `await`ing here might be a problem
            return callback(...args)
        } catch (error) {
            const hasMessage = z.object({ message: z.string() }).safeParse(error).success
            if (hasMessage && (error as { message: string }).message.includes('not a git repository'))
                return options.fallbackValue

            // console.log(error)
            // process.exit(1)
            throw error
        }
    }
}

interface GetWorktreesOptions {
    cwd?: string
}

export const getWorktrees = handleGitErrors(
    { fallbackValue: [] as Worktree[] },
    (options?: GetWorktreesOptions): Worktree[] => {
        const output = execSync('git worktree list --porcelain', options).toString().trim()
        const worktreeTextBlocks = output.split('\n\n').filter(Boolean)
        const repoRootDir = getRepoRootDir()
        const cwd = process.cwd()

        const worktrees = worktreeTextBlocks.map(block => {
            const directory = block.match(/(^worktree .+)/m)?.[0].replace('worktree ', '')
            const branch = block.match(/^branch .+/m)?.[0].replace('branch ', '')
            const isBare = /^bare/m.test(block)

            const head = block.match(/^HEAD .+/m)?.[0].replace('HEAD ', '')
            const isDetached = /^detached/m.test(block)

            const isLocked = /^locked/m.test(block)
            const lockReason = block.match(/^locked .+/m)?.[0].replace('locked ', '')

            const isPrunable = /^prunable/m.test(block)
            const prunableReason = block.match(/^prunable .+/m)?.[0].replace('locked ', '')

            // this should never happen, because a worktree always has a directory
            if (!directory) {
                console.log(`Couldn't match a directory in:\n${block}`.red)
                process.exit(1)
            }

            return {
                directory,
                branch: branch && fixBranchName(branch),
                head,
                isBare,
                isLocked,
                lockReason,
                isDetached,
                isPrunable,
                prunableReason,
                isMainWorktree: repoRootDir == directory,
                isCurrent: cwd == directory || isSubDir(cwd, directory),
            } satisfies Worktree
        })

        return worktrees
    },
)

const getCacheKey = (stuff: object | undefined) => JSON.stringify(stuff || {})

export class GitRepository {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    private static instance = new GitRepository()
    static getInstance() {
        return this.instance
    }

    private wortreeCache: { [key: string]: Worktree[] } = {}
    getWorktrees(options: GetWorktreesOptions = { cwd: process.cwd() }): Worktree[] {
        const cacheKey = getCacheKey(options)
        if (!this.wortreeCache[cacheKey]) this.wortreeCache[cacheKey] = getWorktrees(options)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.wortreeCache[cacheKey]!
    }

    getCurrentWorktree() {
        return this.getWorktrees().find(tree => tree.isCurrent)
    }

    getRepoRootDir() {
        return getRepoRootDir()
    }
}

export const getCommitLogs = (dir?: string, limit?: number) => {
    const cmd = `git log --oneline --graph --decorate --color ${limit ? '-n ' + limit : ''}`
    return execSync(cmd, { cwd: dir }).toString()
}

export const getRepoRootDir = handleGitErrors({ fallbackValue: null }, () => {
    const gitDir = execSync('git rev-parse --git-dir').toString().trim()
    const isAbsolute = path.isAbsolute(gitDir)
    const joined = path.join(process.cwd(), gitDir)
    const resolved = (isAbsolute ? gitDir : joined).replace(/\/\.git.*/, '')

    return resolved
})

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
    exec(`git fetch ${upstream || ''}`)
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
