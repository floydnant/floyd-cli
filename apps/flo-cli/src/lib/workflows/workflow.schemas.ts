import { z } from 'zod'
import { ResolvedStep, stepSchema } from './step.schemas'

export type Workflow = z.infer<typeof workflowSchema>
export const workflowSchema = z.object({
    name: z.string().optional(),
    workflowId: z
        .string()
        .refine(id => !id.includes(' '), { message: 'Workflow ID must not contain spaces' }),
    cwd: z.string().optional(),
    aliases: z.string().array().optional(),
    description: z.string().optional(),
    confirm: z.boolean().default(false).optional(),
    steps: stepSchema.array(),
})

export interface ResolvedWorkflow extends Omit<Workflow, 'steps'> {
    name: string
    steps: ResolvedStep[]
    nestingLevel: number
}