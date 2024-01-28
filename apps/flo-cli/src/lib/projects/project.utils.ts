import prompts from 'prompts'
import { Logger } from '../logger.service'
import { Project } from './projects.schemas'

export const getProjectDisplayStr = (project: Omit<Project, 'worktrees'>, withArrow = false) => {
    const prefix = '    ' // project.isCurrent ? ' -> ' : '    '

    return `${withArrow ? prefix : ''}${project.projectId.blue} ${project.projectConfig.root.grey}${
        project.isCurrent ? ' (current)'.green : ''
    }`
}

export const selectProject = async (
    projects: Project[],
    message = 'Select project',
): Promise<Project | null> => {
    const { selectedProject }: { selectedProject: Project } = await prompts({
        type: 'select',
        name: 'selectedProject',
        message,
        choices: projects.map(project => ({
            title: getProjectDisplayStr(project),
            value: project,
        })),
    })
    if (!selectedProject) {
        Logger.log('No project selected')
        return null
    }

    return selectedProject
}
