/**
 * Check wether the given function is a class and needs to be called with `new`
 * @param fn
 */
export const isClass = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    fn: Function,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): fn is new (...args: any[]) => any => {
    return fn.toString().startsWith('class')
}

export const isNumber = (value: string) => !isNaN(parseInt(value))

export const isHttpUrl = (value: string) => {
    return value.startsWith('http://') || value.startsWith('https://')
}

export const isTruthy = <T>(value: T | undefined | null | false | 0 | ''): value is T => Boolean(value)
