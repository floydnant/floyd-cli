import 'colors'
import path from 'path'
import os from 'os'

export const isSubDir = (dir: string, parentDir: string) => {
    const relative = path.relative(parentDir, dir)
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export const indent = (str: string, spaces = 4) =>
    str
        .split('\n')
        .map(line => ' '.repeat(spaces) + line)
        .join('\n')

export const getPaddedStr = (str: string, fillString = '-') => {
    const DISPLAY_LENGTH = process.stdout.columns

    const length = DISPLAY_LENGTH - str.stripColors.length - 1
    if (length < 1) return ''
    return str + ' ' + fillString.repeat(length).dim
}

export const getRelativePathOf = (pathString: string, from?: string) => {
    const cwd = process.cwd()
    const homedir = os.homedir()
    const isRelativeToHomeDir = from == homedir && cwd != homedir
    const relativePath = path.relative(from || cwd, pathString)

    return (isRelativeToHomeDir ? '~/' : '') + relativePath || './'
}

export const getFlags = (...argsArr: Record<string, string | number | boolean | undefined | null>[]) => {
    const merged = argsArr.map(args => {
        return Object.entries(args)
            .map(([flag, value]) => {
                const isFalsy = !value && typeof value != 'number'
                return isFalsy ? '' : `${flag}${value === true ? '' : ' ' + value}`
            })
            .join(' ')
    })

    return merged.join(' ')
}

// @TODO: this belongs into a test file
// const flags = getFlags(
//     {
//         '--oneline': true,
//         '--graph': true,
//         '--decorate': true,
//         '--color': true,
//         '-n': 5,
//     },
//     {
//         '-n': 10,
//     },
// )
// console.log(args({ '--some-flag': 'with stuff', '-c': false, '-m': true }))
// console.log(flags)

export const getCacheKey = (stuff: object | undefined) => JSON.stringify(stuff || {})

// @TODO: this should be called `memoized`
export const cacheable = <TArgs extends unknown[], TReturn>(callback: (...args: TArgs) => TReturn) => {
    let cache: { [key: string]: TReturn } = {}
    const resetCache = () => {
        cache = {}
    }

    const memoizedCallback = (...args: TArgs) => {
        const cacheKey = getCacheKey(args)
        if (!(cacheKey in cache)) cache[cacheKey] = callback(...args)

        return cache[cacheKey] as TReturn
    }

    return Object.assign(memoizedCallback, { resetCache })
}
