import { z } from 'zod'

export type BaseStep = z.infer<typeof baseStepSchema>
export const baseStepSchema = z.object({
    name: z.string().optional(),
})

export type CommandStep = z.infer<typeof commandStepSchema>
export const commandStepSchema = baseStepSchema.extend({
    command: z.string(),
    cwd: z.string().optional(),
})

// @TODO: @floydnant add support for symlinking instead of copying
export type SymlinkStep = z.infer<typeof symlinkStepSchema>
export const symlinkStepSchema = baseStepSchema.extend({
    symlinkFrom: z.string(),
    to: z.string(),
})

export type FileCopyStep = z.infer<typeof fileCopyStepSchema>
export const fileCopyStepSchema = baseStepSchema.extend({
    copyFrom: z.string(),
    to: z.string(),
})

export type WorkflowStep = z.infer<typeof workflowStepSchema>
export const workflowStepSchema = z.object({
    workflow: z.string(),
})

export type Step = z.infer<typeof stepSchema>
export const stepSchema = z.union([commandStepSchema, fileCopyStepSchema, workflowStepSchema])

export type ResolvedStep = Step & { name: string | undefined }
