import { z } from 'zod'

export enum WorktreeHook {
    OnCreate = 'onCreate',
    OnSwitch = 'onSwitch',
    // OnOpen = 'onOpen',
    // OnBeforeDelete = 'onBeforeDelete',
    // OnRename = 'onRename',
    // OnMove = 'onMove',
}

export type WorktreeConfig = z.infer<typeof worktreeConfigSchema>
export const worktreeConfigSchema = z.object({
    worktreeHooks: z.record(z.nativeEnum(WorktreeHook), z.string()).optional(),
})
