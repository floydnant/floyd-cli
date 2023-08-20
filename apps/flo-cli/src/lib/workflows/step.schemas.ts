import { z } from 'zod'
import { ResolvedWorkflow } from './workflow.schemas'

export const baseStepSchema = z.object({
    name: z.string().optional(),
})
export type BaseStep = z.infer<typeof baseStepSchema>
export interface ResolvedBaseStep extends BaseStep {
    name: string
}

// ------------------------------------------------------------------------

export const commandStepSchema = baseStepSchema.extend({
    command: z.string(),
    cwd: z.string().optional(),
})
export type CommandStep = z.infer<typeof commandStepSchema>
export type ResolvedCommandStep = ResolvedBaseStep & CommandStep

// ------------------------------------------------------------------------

// @TODO: @floydnant add support for symlinking instead of copying
export const symlinkStepSchema = baseStepSchema.extend({
    symlinkFrom: z.string(),
    to: z.string(),
})
export type SymlinkStep = z.infer<typeof symlinkStepSchema>
export type ResolvedSymlinkStep = ResolvedBaseStep & SymlinkStep

// ------------------------------------------------------------------------

export const fileCopyStepSchema = baseStepSchema.extend({
    copyFrom: z.string(),
    to: z.string(),
})
export type FileCopyStep = z.infer<typeof fileCopyStepSchema>
export type ResolvedFileCopyStep = ResolvedBaseStep & FileCopyStep

// ------------------------------------------------------------------------

export const workflowStepSchema = baseStepSchema.extend({
    workflowId: z.string(),
    cwd: z.string().optional(),
})
export type WorkflowStep = z.infer<typeof workflowStepSchema>
export type ResolvedWorkflowStep = ResolvedBaseStep & {
    workflow: ResolvedWorkflow
}

// ==========================================================================================

export type Step = z.infer<typeof stepSchema>
export const stepSchema = z.union([commandStepSchema, fileCopyStepSchema, workflowStepSchema])

export type ResolvedStep = ResolvedCommandStep | ResolvedFileCopyStep | ResolvedWorkflowStep
