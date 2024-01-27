import { fnTestName } from './testing.utils'

describe(fnTestName(fnTestName), () => {
    it('should return the function name', () => {
        const func = () => ''
        expect(fnTestName(func)).toBe('func()')
    })

    it('should throw an error if the function name is not available', () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const func = [() => ''][0]!
        expect(() => fnTestName(func)).toThrowError()
    })
})
