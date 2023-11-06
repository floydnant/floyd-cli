import { GitRepository } from '../adapters/git/git.repo'
import { Logger } from './logger.service'

export class GitService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private gitRepo: GitRepository) {}

    createBranch(branch: string, baseBranch?: string, options?: { logMessage?: boolean; cwd?: string }) {
        if (options?.logMessage !== false)
            Logger.log(
                `Creating branch ${branch.yellow}${baseBranch ? ` off of ${baseBranch.yellow}` : ''}...`,
            )

        return this.gitRepo.createBranch(branch, baseBranch, options)
    }

    private getNextWorktreePath(opts: { folderName?: string; usePrefix?: boolean }) {
        this.gitRepo.assertIsRepository()
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const repoRootDir = this.gitRepo.getRepoRootDir()!
        const repoFolderName = path.basename(repoRootDir)
        const worktrees = this.gitRepo.getWorktrees()

        const usePrefix = opts.usePrefix ?? true
        const folderPrefix = usePrefix ? repoFolderName + '.' : ''
        const folderName = `${folderPrefix}${
            opts.folderName ? opts.folderName?.replace(/\//g, '-') : getNextWorktreeName(worktrees)
        }`
        const directory = path.join(repoRootDir, '../', repoFolderName + '.worktrees/', folderName)

        return { directory, folderName }
    }

    createWorktree(opts: {
        usePrefix?: boolean
        folderName?: string
        /** If a directory is given, `worktreeName` and `worktreePrefix` are ignored. */
        directory?: string
        branch: string
    }): Worktree {
        const branch = opts.branch
        const directory = opts.directory || this.getNextWorktreePath(opts).directory

        this.gitRepo.addWorktree(directory, branch)
        Logger.log(`Created new worktree in ${directory.green} with ${branch.yellow}`)

        return {
            branch,
            directory,
            isMainWorktree: false,
            isCurrent: false,
        }
    }

    private static instance: GitService
    static init(...args: ConstructorParameters<typeof GitService>) {
        if (this.instance) {
            Logger.warn(`${GitService.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new GitService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${GitService.name} not initialized`)
        return this.instance
    }
}
