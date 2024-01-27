import { GitRepository } from '../adapters/git/git.repo'
import { Logger } from './logger.service'

export class GitService {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private gitRepo: GitRepository) {}

    createBranch(branch: string, message: string | false = `Creating branch ${branch.yellow}...`.dim) {
        if (message !== false) Logger.log(message)
        return this.gitRepo.createBranch(branch, null)
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
