import { z } from 'zod'
import { LogLevel } from '../logger.service'
import { workflowSchema } from '../workflows/workflow.schemas'
import { worktreeConfigSchema } from '../worktrees/worktree-config.schemas'

export type ProjectConfig = z.infer<typeof projectConfigSchema>
export const projectConfigSchema = worktreeConfigSchema

export type BaseConfig = z.infer<typeof baseConfigSchema>
export const baseConfigSchema = z.object({
    version: z.string(),
    workflows: workflowSchema.array().optional(),
    // @TODO: @floydnant implement log level config
    logLevel: z.nativeEnum(LogLevel).optional(),
})

export type LocalConfig = z.infer<typeof localConfigSchema>
export const localConfigSchema = baseConfigSchema.merge(projectConfigSchema)

export type GlobalConfig = z.infer<typeof globalConfigSchema>
export const globalConfigSchema = baseConfigSchema.extend({
    projects: z.record(z.string(), projectConfigSchema).optional(),
})

export type Config = z.infer<typeof configSchema>
export const configSchema = globalConfigSchema
