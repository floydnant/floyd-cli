export interface Worktree {
    directory: string
    isMainWorktree: boolean
    isCurrent: boolean

    branch?: string
    head?: string
    isDetached?: boolean
    isLocked?: boolean
    lockReason?: string
    isPrunable?: boolean
    prunableReason?: string
    isBare?: boolean
}
