import path from 'path'
import { fixBranchName } from './git.utils'
import { Worktree } from './git.model'
import { Logger } from '../../lib/logger.service'
import { cacheable, isSubDir, wrapQuotes } from '../../lib/utils'
import { SysCallService } from '../../lib/sys-call.service'
import { NotAGitRepositoryException, transformGitErrors } from './git.errors'

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

export class GitRepository {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private sysCallService: SysCallService) {}

    getWorktrees = cacheable((directory: string): Worktree[] => {
        return transformGitErrors(
            () => {
                const output = this.sysCallService.execPipe('git worktree list --porcelain', {
                    cwd: directory,
                    stdio: 'pipe',
                })
                const worktreeTextBlocks = output.split('\n\n').filter(Boolean)
                const repoRootDir = this.getRepoRootDir(directory)
                const callerCwd = process.cwd()

                const worktrees = worktreeTextBlocks.map<Worktree>(block => {
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
                        throw new Error(`Couldn't match a directory in:\n${block}`)
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
                        isCurrent: callerCwd == directory || isSubDir(callerCwd, directory),
                    } satisfies Worktree
                })

                return worktrees
            },
            { fallbackValue: [] as Worktree[] },
        )
    })

    /** Adds a worktree with an existing branch */
    addWorktree(directory: string, branch: string): Worktree {
        transformGitErrors(() => {
            const output = this.sysCallService.execPipe(
                `git worktree add '${directory}' --checkout '${branch}'`,
            )
            // @TODO: this might need to be moved to the service or removed entirely
            Logger.verbose(output)
        })

        return {
            branch,
            directory,
            isMainWorktree: false,
            isCurrent: false,
        }
    }

    getBranches = cacheable((remote?: boolean) => {
        return this.sysCallService
            .exec(`git branch ${remote ? '-r' : ''} --format "%(refname:short)"`)
            .toString()
            .split('\n')
            .filter(Boolean)
            .map(fixBranchName)
    })

    listRemoteHeads = cacheable((remote?: string) => {
        return this.sysCallService.execPipe(`git ls-remote --heads ${remote || ''}`)
    })

    getCurrentBranch = cacheable((workingDir?: string) => {
        return this.sysCallService.execPipe('git branch --show-current', { cwd: workingDir })
    })

    getCurrentWorktree() {
        return this.getWorktrees(process.cwd()).find(tree => tree.isCurrent)
    }

    getRepoRootDir = cacheable((directory: string) =>
        transformGitErrors(
            () => {
                const gitDir = this.sysCallService.execPipe('git rev-parse --git-dir', {
                    cwd: directory,
                    stdio: 'pipe',
                })
                const isAbsolute = path.isAbsolute(gitDir)
                const joined = path.join(directory, gitDir)
                const resolved = (isAbsolute ? gitDir : joined).replace(/\/\.git.*/, '')

                return resolved
            },
            { fallbackValue: null },
        ),
    )

    assertIsRepository(directory: string) {
        if (!this.getRepoRootDir(directory)) {
            Logger.error('Not in a git repository')
            throw new NotAGitRepositoryException()
        }
    }

    getGitStatus = cacheable((directory?: string) => {
        return this.sysCallService.execPipe('git status --short', { cwd: directory })
    })

    getCommitLogs = cacheable((dir?: string, limit?: number) => {
        const cmd = `git log --oneline --graph --decorate --color ${limit ? '-n ' + limit : ''}`
        return this.sysCallService.exec(cmd, { cwd: dir })
    })

    getHeadHash = cacheable((dir?: string) => {
        return this.sysCallService.execPipe('git rev-parse HEAD', { cwd: dir })
    })

    getDateOfRef = cacheable((ref: string, dir?: string) => {
        const output = this.sysCallService.execPipe(`git show --no-patch --format=%ci '${ref}'`, { cwd: dir })
        return new Date(output)
    })

    getRemoteOf(branch: string) {
        try {
            return this.sysCallService.execPipe(`git config --get branch.${branch}.remote`) || null
        } catch {
            return null
        }
    }

    // @TODO: remove logging
    /** `git branch <branchName> [baseBranch]` */
    createBranch(branch: string, baseBranch?: string, options?: { cwd?: string }) {
        return transformGitErrors(() => {
            return this.sysCallService.execPipe(`git branch '${branch}' ${wrapQuotes(baseBranch)}`, options)
        })
    }

    // @TODO: remove logging
    deleteBranch(branch: string, force = false) {
        return transformGitErrors(() => {
            const output = this.sysCallService.execPipe(`git branch ${force ? '-D' : '-d'} '${branch}'`)
            const highlighted = output.replace(branch, match => match.yellow)
            Logger.log(highlighted)
        })
    }

    // @TODO: remove logging
    gitFetch(upstream?: string) {
        return transformGitErrors(() => {
            Logger.log(`Fetching${upstream ? ' from upstream ' + upstream.magenta : ''}...`)
            this.sysCallService.execInherit(`git fetch ${upstream || ''}`)
        })
    }

    // @TODO: remove logging
    gitPull(upstream?: string, workingDir?: string) {
        const upstreamText = upstream ? ' from ' + upstream.magenta : ''
        return transformGitErrors(() => {
            try {
                Logger.verbose(`\nPulling${upstreamText}...`.dim)
                this.sysCallService.execInherit(`git pull ${upstream || ''}`, { cwd: workingDir })
            } catch {
                Logger.error(`Failed to pull${upstreamText}`.red)
            }
        })
    }

    gitCheckout(branchName: string, workingDir?: string) {
        return transformGitErrors(() => {
            return this.sysCallService.execPipe(`git checkout ${branchName}`, { cwd: workingDir })
        })
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
