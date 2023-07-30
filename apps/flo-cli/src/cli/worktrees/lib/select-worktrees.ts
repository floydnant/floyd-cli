import prompts from 'prompts'
import { Worktree, getGitStatus, getWorktreeDisplayStr, getWorktrees } from '../../../adapters/git'

export const selectWorktrees = async (
    worktrees = getWorktrees(),
    opts?: { message?: string; multiple?: boolean },
): Promise<Worktree[] | null> => {
    const multiple = opts?.multiple ?? true
    const defaultMessage = multiple ? 'Select worktrees' : 'Select a worktree'
    const message = opts?.message || defaultMessage

    const { trees }: { trees?: Worktree[] | Worktree } = await prompts({
        type: multiple ? 'multiselect' : 'select',
        name: 'trees',
        message: message || defaultMessage,
        choices: worktrees.map(tree => ({
            title: getWorktreeDisplayStr(tree, !!getGitStatus(tree.dir)),
            value: tree,
        })),
        instructions: false,
    })
    const trees_ = [trees].flat().filter(Boolean) as Worktree[]

    if (!trees_?.length) {
        console.log(multiple ? 'No worktrees selected' : 'No worktree selected')
        return null
    }
    return trees_
}
