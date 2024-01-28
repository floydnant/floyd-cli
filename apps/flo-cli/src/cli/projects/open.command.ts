import { createCommand } from 'commander'
import { GitRepository } from '../../adapters/git'
import { ConfigService } from '../../lib/config/config.service'
import { GitService } from '../../lib/git.service'
import { Logger, customErrorWriter } from '../../lib/logger.service'
import { OpenController } from '../../lib/open/open.controller'
import { selectProject } from '../../lib/projects/project.utils'
import { ProjectsService } from '../../lib/projects/projects.service'
import { PromptController } from '../../lib/prompt.controller'
import { WorkflowController } from '../../lib/workflows/workflow.controller'
import { WorktreeController } from '../../lib/worktrees/worktree.controller'
import { WorktreeService } from '../../lib/worktrees/worktree.service'
import { AppOptionArg, ReuseWindowOptionArg, appOption, reuseWindowOption } from '../shared.options'
import { SysCallService } from '../../lib/sys-call.service'
import { WorkflowService } from '../../lib/workflows/workflow.service'
import { ContextService } from '../../lib/config/context.service'

// @TODO: update this to the controller pattern

export const openCommand = createCommand('open')
    .configureOutput(customErrorWriter)
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
        const workflowService = WorkflowService.init(configService, ContextService.getInstance())
        const worktreeController = WorktreeController.init(
            gitRepo,
            GitService.getInstance(),
            WorktreeService.init(gitRepo, projectsService, workflowService, SysCallService.getInstance()),
            WorkflowController.init(
                workflowService,
                ContextService.getInstance(),
                SysCallService.getInstance(),
                PromptController.getInstance(),
            ),
            PromptController.getInstance(),
        )

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

        const selectedWorktree = await worktreeController.selectWorktree('Select a worktree to open', {
            worktrees: selectedProject.worktrees,
        })
        if (!selectedWorktree) return

        openController.openFolder(selectedWorktree.directory, options)
    })
