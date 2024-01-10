import { z } from 'zod'
import { Worktree } from '../../adapters/git'
import { ProjectConfig } from '../config/config.schemas'

export type Project = {
    projectId: string
    projectConfig: ProjectConfig
    isCurrent: boolean
    worktrees: Worktree[]
    aliases: string[]
}

const maskOf = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>): Record<keyof TShape, true> => {
    return Object.fromEntries(Object.keys(schema.shape).map(key => [key, true])) as Record<keyof TShape, true>
}
