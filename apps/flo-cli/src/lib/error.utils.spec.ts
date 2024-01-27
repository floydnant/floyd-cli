import { matchError } from './errors.utils'
import { fnTestName } from './testing.utils'

// @TODO: write proper tests for this

describe('git errors', () => {
    describe(fnTestName(matchError), () => {
        it('should match the error', () => {
            const error = `Error: some error occured
            error: pathspec 'non-existent' did not match any file(s) known to git`
            const result = matchError(
                error,
                /error: pathspec '(?<branch>.+)' did not match any file\(s\) known to git/,
            )

            expect(result).toEqual({
                isMatch: true,
                groups: { branch: 'non-existent' },
                originalMessage: error,
            } satisfies ReturnType<typeof matchError>)
        })

        it('should not match the error', () => {
            const error = `Error: some error occured
            error: pathspec 'non-existent' did not match any file(s) known to git`
            const result = matchError(error, /error: invalid reference: '(?<branch>.+)'/)

            expect(result).toEqual({
                isMatch: false,
                groups: {},
                originalMessage: error,
            } satisfies ReturnType<typeof matchError>)
        })
    })
})
