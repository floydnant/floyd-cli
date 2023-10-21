import { GitExceptionCode, matchGitError } from './git.errors'

describe('git errors', () => {
    describe('matchGitError', () => {
        const map = {
            [GitExceptionCode.PATHSPEC_DID_NOT_MATCH_ANY_FILES]: `Error: some error occured
            error: pathspec 'non-existent' did not match any file(s) known to git`,
        }

        for (const [code, error] of Object.entries(map)) {
            it(`should match error: ${code}`, () => {
                const branch = matchGitError(error)?.code
                expect(branch).toEqual(code)
            })
        }
    })
})
