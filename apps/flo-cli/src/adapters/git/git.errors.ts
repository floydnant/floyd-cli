import { CustomExceptionConstructor, Exception, matchError } from '../../lib/errors.utils'
import { Logger } from '../../lib/logger.service'

export enum GitExceptionCode {
    /**
     * This happens when trying to create a worktree with a branch that doesn't exist
     *
     * ```sh
     * git worktree add path/to/worktree --checkout non-existent
     * ```
     * ```txt
     * fatal: invalid reference: non-existent
     * ```
     */
    INVALID_REFERENCE = 'fatal: invalid reference',

    /**
     * This happens when trying to checkout a branch that doesn't exist
     *
     * ```sh
     * git checkout non-existent-branch
     * ```
     * ```txt
     * error: pathspec 'non-existent-branch' did not match any file(s) known to git
     * ```
     */
    PATHSPEC_DID_NOT_MATCH_ANY_FILES = 'error: pathspec did not match any file(s) known to git',

    /**
     * This happens when trying to run a git command outside of a git repository
     *
     * ```sh
     * git branch # or any other git command
     * ```
     * ```txt
     * fatal: not a git repository (or any of the parent directories): .git
     * ```
     */
    NOT_A_GIT_REPOSITORY = 'fatal: not a git repository (or any of the parent directories): .git',

    /**
     * ```sh
     * git branch '???'
     * ```
     * ```txt
     * fatal: '???' is not a valid branch name
     * ```
     */
    NOT_A_VALID_BRANCH_NAME = "fatal: '???' is not a valid branch name",
}

/**
 * This happens when trying to create a worktree with a branch that doesn't exist
 *
 * ```sh
 * git worktree add path/to/worktree --checkout non-existent
 * ```
 * ```txt
 * fatal: invalid reference: non-existent
 * ```
 */
export class InvalidReferenceException extends Exception {
    static regex = /fatal: invalid reference: (?<branch>.+)/
    class = InvalidReferenceException
    code = GitExceptionCode.INVALID_REFERENCE

    static fromError(error: unknown): InvalidReferenceException | null {
        const match = matchError(error, this.regex)
        if (match.isMatch) return new InvalidReferenceException(match.originalMessage, match.groups['branch'])

        return null
    }

    constructor(originalMessage: string, branch = '???') {
        super(originalMessage, `Branch/Ref ${branch.yellow} does not exist`)
    }
}

/**
 * This happens when trying to checkout a branch that doesn't exist
 *
 * ```sh
 * git checkout non-existent-branch
 * ```
 * ```txt
 * error: pathspec 'non-existent-branch' did not match any file(s) known to git
 * ```
 */
export class PathspecDidNotMatchFilesException extends Exception {
    static regex = /error: pathspec '(?<branch>.+)' did not match any file\(s\) known to git/
    class = PathspecDidNotMatchFilesException
    code = GitExceptionCode.PATHSPEC_DID_NOT_MATCH_ANY_FILES

    static fromError(error: unknown): PathspecDidNotMatchFilesException | null {
        const match = matchError(error, this.regex)
        if (match.isMatch)
            return new PathspecDidNotMatchFilesException(match.originalMessage, match.groups['branch'])

        return null
    }

    constructor(originalMessage: string, branch = '???') {
        super(originalMessage, `Branch/Ref ${branch.yellow} does not exist`)
    }
}

/**
 * This happens when trying to run a git command outside of a git repository
 *
 * ```sh
 * git branch # or any other git command
 * ```
 * ```txt
 * fatal: not a git repository (or any of the parent directories): .git
 * ```
 */
export class NotAGitRepositoryException extends Exception {
    static regex = /fatal: not a git repository \(or any of the parent directories\): .git/
    class = NotAGitRepositoryException
    code = GitExceptionCode.NOT_A_GIT_REPOSITORY

    static fromError(error: unknown): NotAGitRepositoryException | null {
        const match = matchError(error, this.regex)
        if (match.isMatch) return new NotAGitRepositoryException()

        return null
    }

    constructor() {
        super(
            'fatal: not a git repository (or any of the parent directories): .git',
            'Not in a git repository',
        )
    }
}

/**
 * ```sh
 * git branch '???'
 * ```
 * ```txt
 * fatal: '???' is not a valid branch name
 * ```
 */
export class NotAValidBranchNameException extends Exception {
    static regex = /fatal: '(?<branch>.+)' is not a valid branch name/
    class = NotAValidBranchNameException
    code = GitExceptionCode.NOT_A_VALID_BRANCH_NAME

    static fromError(error: unknown): NotAValidBranchNameException | null {
        const match = matchError(error, this.regex)
        if (match.isMatch)
            return new NotAValidBranchNameException(match.originalMessage, match.groups['branch'])

        return null
    }

    constructor(originalMessage: string, branch = '???') {
        super(originalMessage, `'${branch.yellow}' is not a valid branch name`)
    }
}

const gitExceptionMap = {
    [GitExceptionCode.NOT_A_GIT_REPOSITORY]: NotAGitRepositoryException,
    [GitExceptionCode.PATHSPEC_DID_NOT_MATCH_ANY_FILES]: PathspecDidNotMatchFilesException,
    [GitExceptionCode.INVALID_REFERENCE]: InvalidReferenceException,
    [GitExceptionCode.NOT_A_VALID_BRANCH_NAME]: NotAValidBranchNameException,
} satisfies Record<GitExceptionCode, CustomExceptionConstructor>
const gitExceptions = Object.values(gitExceptionMap)

export type GitExceptionConstructor = (typeof gitExceptionMap)[keyof typeof gitExceptionMap]
export type GitException = InstanceType<GitExceptionConstructor>

export const matchGitError = (error: unknown): GitException | null => {
    for (const constructor of gitExceptions) {
        if (error instanceof constructor) return error

        const exception = constructor.fromError(error)

        if (exception) {
            Logger.debug(`Matched ${constructor.name.bold} from error: ${String(error).red}`)
            return exception
        }
    }

    return null
}

// @TODO: this needs to be refactored out if we need this mechanism elsewhere
/**
 * This will throw an appropriate `GitException` if the callback throws an error that matches one of git's error messages.
 */
export const transformGitErrors = <TReturn, TFallback = never>(
    callback: () => TReturn,
    options?: {
        fallbackValue: TFallback
        fallbackOnlyWhen?: GitExceptionConstructor[]
    },
): TReturn | TFallback => {
    try {
        return callback()
    } catch (error) {
        const exception = matchGitError(error)
        if (!exception) throw error

        const opts = options || {}
        if ('fallbackValue' in opts) {
            if (options?.fallbackOnlyWhen && !options.fallbackOnlyWhen.includes(exception.class)) throw error

            return opts.fallbackValue as TFallback
        }

        throw exception
    }
}
