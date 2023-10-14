import prompts from 'prompts'
import { GitRepository, Worktree, getWorktreeDisplayStr } from '../../adapters/git'

export const selectWorktrees = async (
    worktrees: Worktree[],
    opts?: { message?: string; multiple?: boolean },
): Promise<Worktree[] | null> => {
    const gitRepo = GitRepository.getInstance()

    const multiple = opts?.multiple ?? true
    const defaultMessage = multiple ? 'Select worktrees' : 'Select a worktree'
    const message = opts?.message || defaultMessage

    const { trees }: { trees?: Worktree[] | Worktree } = await prompts({
        type: multiple ? 'multiselect' : 'select',
        name: 'trees',
        message: message || defaultMessage,
        choices: worktrees.map(tree => ({
            title: getWorktreeDisplayStr(tree, !!gitRepo.getGitStatus(tree.directory)),
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
