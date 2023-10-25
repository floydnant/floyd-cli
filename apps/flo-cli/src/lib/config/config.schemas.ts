import { z } from 'zod'
import { workflowSchema } from '../workflows/workflow.schemas'
import { worktreeConfigSchema } from '../worktrees/worktree-config.schemas'
import { DEFAULT_LOG_LEVEL } from './config.vars'
import { validateWorkflows } from '../workflows/validate-workflows'
import { LogLevel } from '../logger.types'
import { customOpenPortConfigSchema } from '../open/custom-open.schema'
import { OpenType } from '../open/open.types'

export type ProjectConfig = z.infer<typeof projectConfigSchema>
export const projectConfigSchema = z.object({ root: z.string() }).merge(worktreeConfigSchema)

export type BaseConfig = z.infer<typeof baseConfigSchema>
export const baseConfigSchema = z.object({
    version: z.string(),
    logLevel: z.nativeEnum(LogLevel).default(DEFAULT_LOG_LEVEL),
    workflows: workflowSchema
        .array()
        .optional()
        .refine(validateWorkflows, { message: 'Invalid workflow definition, see above.' }),
    openIn: z
        .object({
            defaults: z.record(z.nativeEnum(OpenType), z.string()).optional(),
            apps: customOpenPortConfigSchema.array().optional(),
        })
        .optional(),
})

export type LocalConfig = z.infer<typeof localConfigSchema>
export const localConfigSchema = baseConfigSchema.merge(projectConfigSchema.omit({ root: true }))

export type GlobalConfig = z.infer<typeof globalConfigSchema>

export const PROJECTS_CONFIG_KEY = 'projects'
export const globalConfigSchema = baseConfigSchema.extend({
    [PROJECTS_CONFIG_KEY]: z.record(z.string(), projectConfigSchema).optional(),
})

export type Config = z.infer<typeof configSchema>
export const configSchema = globalConfigSchema
