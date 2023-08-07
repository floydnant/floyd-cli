import { z } from 'zod'
import { stepSchema } from './step.schemas'

export type Workflow = z.infer<typeof workflowSchema>
export const workflowSchema = z.object({
    name: z.string().optional(),
    workflowId: z
        .string()
        .refine(id => !id.includes(' '), { message: 'Workflow ID must not contain spaces' }),
    aliases: z.string().array().optional(),
    description: z.string().optional(),
    confirm: z.boolean().default(false).optional(),
    steps: stepSchema.array(),
})
