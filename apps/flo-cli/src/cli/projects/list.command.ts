import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { Logger, customErrorWriter } from '../../lib/logger.service'
import { ProjectsService } from '../../lib/projects/projects.service'

// @TODO: update this to the controller pattern

export const listCommand = new Command()
    .createCommand('list')
    .configureOutput(customErrorWriter)
    .alias('ls')
    .description('List projects')
    .action(() => {
        const gitRepo = GitRepository.getInstance()
        const projectsService = ProjectsService.init(gitRepo, ConfigService.getInstance())
        const configService = ConfigService.getInstance()

        const projectMap = configService.config.projects
        if (!projectMap || Object.keys(projectMap).length == 0) {
            Logger.error('No projects configured')
            return
        }

        projectsService.printProjects(projectMap)
    })
