import { Command } from 'commander'
import { GitRepository } from '../../adapters/git'
import { PROJECTS_CONFIG_KEY } from '../../lib/config/config.schemas'
import { ConfigService } from '../../lib/config/config.service'
import { Logger } from '../../lib/logger.service'
import { ProjectsService } from '../../lib/projects/projects.service'
import { indent } from '../../lib/utils'

// @TODO: update this to the controller pattern

export const addCommand = new Command()
    .createCommand('add')
    .description('Add project')
    .argument('[path]', 'Path to the project', '<cwd>')
    .action((options: { path?: string }) => {
        const configService = ConfigService.getInstance()
        const gitRepo = GitRepository.getInstance()
        const projectsService = ProjectsService.init(gitRepo, configService)

        const { projectId, root } = projectsService.getProject(options.path)
        Logger.log("As of right now, we can't update your config automatically.")

        const hasProjectsKey = PROJECTS_CONFIG_KEY in configService.config
        if (hasProjectsKey) {
            Logger.log(`So add this to your ${PROJECTS_CONFIG_KEY} key in the global config:\n`)
            Logger.log(indent(`"${projectId}": ${JSON.stringify({ root }, null, 4)}`).yellow)
        } else {
            Logger.log('So add this to your global config:\n')
            Logger.log(
                indent(`"${PROJECTS_CONFIG_KEY}": ${JSON.stringify({ [projectId]: { root } }, null, 4)}`)
                    .yellow,
            )
        }
        Logger.log()
    })
