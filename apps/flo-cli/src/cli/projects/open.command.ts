import { Command } from 'commander'
import { ConfigService } from '../../lib/config/config.service'
import { Logger } from '../../lib/logger.service'
import { selectProject } from '../../lib/projects/project.utils'
import { openWithVscode } from '../../lib/utils'
import { selectWorktrees } from '../worktrees/lib/select-worktrees'
import { ProjectsService } from '../../lib/projects/projects.service'
import { GitRepository } from '../../adapters/git'

export const openCommand = new Command()
    .createCommand('open')
    .description('Open project')
    .alias('o')
    .option('-r, --reuse-window', 'Reuse existing VSCode window', false)
    // @TODO:
    // .argument('[project-or-alias]', 'The projectId or alias')
    .action(async ({ reuseWindow }: { reuseWindow: boolean }) => {
        const projectMap = ConfigService.getInstance().config.projects
        if (!projectMap || Object.keys(projectMap).length == 0) {
            Logger.error('No projects configured')
            return
        }

        const projectsService = new ProjectsService(GitRepository.getInstance())
        const projects = projectsService.resolveProjectMap(projectMap)

        const selectedProject = await selectProject(projects, 'Select project to open')
        if (!selectedProject) return

        if (selectedProject.worktrees.length == 1) {
            openWithVscode(selectedProject.projectConfig.root, { reuseWindow })
            return
        }

        const result = await selectWorktrees(selectedProject.worktrees, {
            message: 'Select worktree to open',
            multiple: false,
        })
        if (!result?.[0]) return

        openWithVscode(result[0].directory, { reuseWindow })
    })
