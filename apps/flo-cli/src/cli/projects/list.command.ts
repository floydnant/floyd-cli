import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { Logger } from '../../lib/logger.service'
import { ProjectsService } from '../../lib/projects/projects.service'

export const listCommand = new Command()
    .createCommand('list')
    .alias('ls')
    .description('List projects')
    .action(() => {
        const gitRepo = GitRepository.getInstance()
        const projectsService = ProjectsService.init(gitRepo)
        const configService = ConfigService.getInstance()

        const projectMap = configService.config.projects
        if (!projectMap || Object.keys(projectMap).length == 0) {
            Logger.error('No projects configured')
            return
        }

        projectsService.printProjects(projectMap)
    })