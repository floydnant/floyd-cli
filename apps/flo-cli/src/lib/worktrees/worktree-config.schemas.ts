import { z } from 'zod'

export enum WorktreeHook {
    OnCreate = 'onCreate',
    OnCheckout = 'onCheckout',
    BeforeOpen = 'beforeOpen',
    // BeforeDelete = 'beforeDelete',
    // OnMove = 'onMove',
}

export type WorktreeConfig = z.infer<typeof worktreeConfigSchema>
export const worktreeConfigSchema = z.object({
    worktreeHooks: z.record(z.nativeEnum(WorktreeHook), z.string()).optional(),
})
