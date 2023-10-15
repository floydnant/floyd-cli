import path from 'path'
import { fixBranchName } from './git.utils'
import { Worktree } from './git.model'
import { Logger } from '../../lib/logger.service'
import { cacheable, isSubDir } from '../../lib/utils'
import { z } from 'zod'
import { SysCallService } from '../../lib/sys-call.service'

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

const errorWithMessageSchema = z.object({ message: z.string() })
const handleGitErrors = <TArgs extends unknown[], TReturn, TFallback>(
    options: { fallbackValue: TFallback },
    callback: (...args: TArgs) => TReturn,
) => {
    return (...args: TArgs) => {
        try {
            // @TODO: @floydnant lets see, not `await`ing here might be a problem
            return callback(...args)
        } catch (error) {
            const result = errorWithMessageSchema.safeParse(error)
            const hasMessage = result.success

            if (hasMessage && result.data.message.includes('not a git repository'))
                return options.fallbackValue

            // console.log(error)
            // process.exit(1)
            throw error
        }
    }
}

export class GitRepository {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private sysCallService: SysCallService) {}

    getWorktrees = cacheable(
        handleGitErrors({ fallbackValue: [] as Worktree[] }, (options?: { cwd?: string }): Worktree[] => {
            const output = this.sysCallService
                .execSync('git worktree list --porcelain', { cwd: options?.cwd, stdio: 'pipe' })
                .trim()
            const worktreeTextBlocks = output.split('\n\n').filter(Boolean)
            const repoRootDir = this.getRepoRootDir(options?.cwd)
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
                    Logger.error(`Couldn't match a directory in:\n${block}`.red)
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
        }),
    )

    getBranches = cacheable((remote?: boolean) => {
        return this.sysCallService
            .execSync(`git branch ${remote ? '-r' : ''} --format "%(refname:short)"`)
            .toString()
            .split('\n')
            .filter(Boolean)
            .map(fixBranchName)
    })

    getCurrentBranch = cacheable((workingDir?: string) => {
        return this.sysCallService.execSync('git branch --show-current', { cwd: workingDir }).trim()
    })

    getCurrentWorktree() {
        return this.getWorktrees().find(tree => tree.isCurrent)
    }

    getRepoRootDir = cacheable(
        handleGitErrors({ fallbackValue: null }, (cwd: string = process.cwd()) => {
            const gitDir = this.sysCallService
                .execSync('git rev-parse --git-dir', { cwd, stdio: 'pipe' })
                .trim()
            const isAbsolute = path.isAbsolute(gitDir)
            const joined = path.join(cwd, gitDir)
            const resolved = (isAbsolute ? gitDir : joined).replace(/\/\.git.*/, '')

            return resolved
        }),
    )

    getGitStatus = cacheable((directory?: string) => {
        return this.sysCallService.execSync('git status --short', { cwd: directory }).trim()
    })

    getCommitLogs = cacheable((dir?: string, limit?: number) => {
        const cmd = `git log --oneline --graph --decorate --color ${limit ? '-n ' + limit : ''}`
        return this.sysCallService.execSync(cmd, { cwd: dir })
    })

    getRemoteOf(branch: string) {
        try {
            return this.sysCallService.execSync(`git config --get branch.${branch}.remote`).trim() || null
        } catch {
            return null
        }
    }

    /** `git branch <branchName>` */
    createBranch(branchName: string, message: string | null = `Creating branch ${branchName.green}...`.dim) {
        if (message !== null) Logger.getInstance().log(message)
        this.sysCallService.exec(`git branch ${branchName}`)
    }

    deleteBranch(branchName: string, loggerMessage: string | null = `Deleted branch ${branchName}`) {
        this.sysCallService.execSync(`git branch -d ${branchName}`)
        if (loggerMessage !== null) Logger.getInstance().verbose(loggerMessage)
    }

    gitFetch(upstream?: string) {
        Logger.getInstance().verbose(`\nFetching${upstream ? ' from upstream ' + upstream.magenta : ''}...`)
        this.sysCallService.exec(`git fetch ${upstream || ''}`)
    }

    gitPull(upstream?: string, workingDir?: string) {
        const upstreamText = upstream ? ' from ' + upstream.magenta : ''
        try {
            Logger.getInstance().verbose(`\nPulling${upstreamText}...`.dim)
            this.sysCallService.exec(`git pull ${upstream || ''}`, { cwd: workingDir })
        } catch {
            Logger.getInstance().error(`Failed to pull${upstreamText}`.red)
        }
    }

    gitCheckout(branchName: string, workingDir?: string) {
        Logger.getInstance().log()
        return this.sysCallService.execSync(`git checkout ${branchName}`, { cwd: workingDir })
    }

    private static instance: GitRepository
    static init(...args: ConstructorParameters<typeof GitRepository>) {
        if (this.instance) {
            Logger.warn(`${GitRepository.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new GitRepository(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${GitRepository.name} not initialized`)
        return this.instance
    }
}
