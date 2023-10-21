import path from 'path'
import { GitRepository, getWorktreeDisplayStr } from '../../adapters/git'
import { PROJECTS_CONFIG_KEY, ProjectConfig } from '../config/config.schemas'
import { Logger } from '../logger.service'
import { getPaddedStr, indent } from '../utils'
import { getProjectDisplayStr } from './project.utils'
import { Project } from './projects.schemas'
import { ConfigService } from '../config/config.service'

export class ProjectsService {
    /** Do not use this constructor directly, use `ProjectsService.init()` instead */
    constructor(
        private gitRepo: GitRepository,
        private configService: ConfigService,
    ) {}

    getProject(cwd = process.cwd()) {
        const root = this.gitRepo.getRepoRootDir(cwd) || cwd
        const projectId = path.basename(root)
        const config = this.configService.config[PROJECTS_CONFIG_KEY]?.[projectId]

        return { projectId, root, config }
    }

    printProjects(projects: Record<string, ProjectConfig>) {
        const repoRoot = this.gitRepo.getRepoRootDir()

        for (const projectId in projects) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const projectRoot = projects[projectId]!.root
            const isCurrent = projectRoot === repoRoot
            // const prefix = isCurrent ? ' -> ' : '   '
            const projectDisplayStr = getProjectDisplayStr(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                { projectId, projectConfig: projects[projectId]!, isCurrent },
                true,
            )
            const worktrees = this.gitRepo.getWorktrees({ cwd: projectRoot })
            const worktreeNames = worktrees
                .map(
                    tree =>
                        (tree.isCurrent ? ' -> ' : '    ') +
                        getWorktreeDisplayStr(tree, !!this.gitRepo.getGitStatus(tree.directory)),
                )
                .join('\n')

            Logger.log()
            Logger.log(getPaddedStr(projectDisplayStr))
            Logger.log(indent(worktreeNames, 4))
            Logger.log()
        }
    }

    resolveProjectMap(projectMap: Record<string, ProjectConfig>): Project[] {
        const repoRoot = this.gitRepo.getRepoRootDir()

        const projects = Object.entries(projectMap).map(([projectId, projectConfig]) => {
            const isCurrent = projectConfig.root === repoRoot
            const getWorktrees = () => this.gitRepo.getWorktrees({ cwd: projectConfig.root })

            return {
                projectId,
                projectConfig,
                isCurrent,
                get worktrees() {
                    // this operation is expensive, so we only do it when needed
                    // + `getWorktrees` is memoized, so it won't be expensive the second time we need it
                    return getWorktrees()
                },
            } satisfies Project
        })

        return projects
    }

    private static instance: ProjectsService
    static init(...args: ConstructorParameters<typeof ProjectsService>) {
        this.instance = new this(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${ProjectsService.name} not initialized`)
        return this.instance
    }
}
