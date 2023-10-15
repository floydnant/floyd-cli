import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { Logger } from '../../lib/logger.service'
import { OpenService } from '../../lib/open/open.service'
import { OpenType } from '../../lib/open/open.types'
import { selectProject } from '../../lib/projects/project.utils'
import { ProjectsService } from '../../lib/projects/projects.service'
import { selectWorktrees } from '../../lib/worktrees/select-worktrees'

export const openCommand = new Command()
    .createCommand('open')
    .description('Open project')
    .alias('o')
    .option('-r, --reuse-window', 'Reuse existing VSCode window', false)
    // @TODO:
    // .argument('[project-or-alias]', 'The projectId or alias')
    .action(async ({ reuseWindow }: { reuseWindow: boolean }) => {
        const gitRepo = GitRepository.getInstance()
        const projectsService = new ProjectsService(gitRepo)
        const configService = ConfigService.getInstance()
        const openService = OpenService.getInstance().useFirst(OpenType.Vscode)

        const projectMap = configService.config.projects
        if (!projectMap || Object.keys(projectMap).length == 0) {
            Logger.error('No projects configured')
            return
        }

        const projects = projectsService.resolveProjectMap(projectMap)

        const selectedProject = await selectProject(projects, 'Select project to open')
        if (!selectedProject) return

        if (selectedProject.worktrees.length == 1) {
            openService.open(selectedProject.projectConfig.root, { reuseWindow })
            return
        }

        const result = await selectWorktrees(selectedProject.worktrees, {
            message: 'Select worktree to open',
            multiple: false,
        })
        if (!result?.[0]) return

        openService.open(result[0].directory, { reuseWindow })
    })
