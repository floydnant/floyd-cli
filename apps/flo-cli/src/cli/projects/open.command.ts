import { createCommand } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { GitController } from '../../lib/git.controller'
import { Logger } from '../../lib/logger.service'
import { OpenController } from '../../lib/open/open.controller'
import { selectProject } from '../../lib/projects/project.utils'
import { ProjectsService } from '../../lib/projects/projects.service'
import { AppOptionArg, ReuseWindowOptionArg, appOption, reuseWindowOption } from '../shared.options'

export const openCommand = createCommand('open')
    .description('Open project')
    .alias('o')
    .addOption(appOption)
    .addOption(reuseWindowOption)
    // @TODO:
    // .argument('[project-or-alias]', 'The projectId or alias')
    .action(async (options: ReuseWindowOptionArg & AppOptionArg) => {
        const gitRepo = GitRepository.getInstance()
        const configService = ConfigService.getInstance()
        const projectsService = ProjectsService.init(gitRepo, configService)
        const gitController = GitController.getInstance()
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
            openController.openFolder(selectedProject.projectConfig.root, options)
            return
        }

        const selectedWorktree = await gitController.selectWorktree('Select a worktree to open', {
            worktrees: selectedProject.worktrees,
        })
        if (!selectedWorktree) return

        openController.openFolder(selectedWorktree.directory, options)
    })
