import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { GitController } from '../../lib/git.controller'
import { Logger } from '../../lib/logger.service'
import { OpenController } from '../../lib/open/open.controller'
import { selectProject } from '../../lib/projects/project.utils'
import { ProjectsService } from '../../lib/projects/projects.service'

export const openCommand = new Command()
    .createCommand('open')
    .description('Open project')
    .alias('o')
    .option('-r, --reuse-window', 'Reuse existing window (if supported by app)', false)
    // @TODO:
    // .argument('[project-or-alias]', 'The projectId or alias')
    .action(async ({ reuseWindow }: { reuseWindow: boolean }) => {
        const gitRepo = GitRepository.getInstance()
        const projectsService = new ProjectsService(gitRepo)
        const configService = ConfigService.getInstance()
        const gitController = GitController.getInstance()
        // @TODO: this should be configurable
        const openController = OpenController.getInstance()

        const projectMap = configService.config.projects
        if (!projectMap || Object.keys(projectMap).length == 0) {
            Logger.error('No projects configured')
            return
        }

        const projects = projectsService.resolveProjectMap(projectMap)

        const selectedProject = await selectProject(projects, 'Select project to open')
        if (!selectedProject) return

        if (selectedProject.worktrees.length == 1) {
            openController.openFolder(selectedProject.projectConfig.root, { reuseWindow })
            return
        }

        const selectedWorktree = await gitController.selectWorktree('Select a worktree to open')
        if (!selectedWorktree) return

        openController.openFolder(selectedWorktree.directory, { reuseWindow })
    })
