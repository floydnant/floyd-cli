import { execSync } from 'child_process'
import 'colors'
import path from 'path'
import { Logger } from './logger.service'

export const exec = (command: string, workingDir?: string) =>
    execSync(command, { stdio: 'inherit', cwd: workingDir })

// This is random WIP btw, don't bother
export class Exec {
    static execSync(command: string, options: Parameters<typeof execSync>[1] = {}) {
        Logger.getInstance().debug(`Executing: ${command.cyan}`)
        return execSync(command, options)?.toString()
    }

    static exec(command: string, options: Parameters<typeof execSync>[1] = {}) {
        Logger.getInstance().debug(`Executing: ${command.cyan}`)
        return execSync(command, { stdio: 'inherit', ...options })?.toString()
    }
}

// @TODO: this should be named `testCommand`
export const test = (command: string) => {
    try {
        execSync(command, { stdio: 'ignore' })
        return true
    } catch {
        return false
    }
}

export const assertGitHubInstalled = () => {
    if (test('gh --version')) return

    Logger.getInstance().error(
        'Please install gh cli with `brew install gh` or go here: https://cli.github.com/manual/installation'
            .red,
    )
    process.exit(1)
}

export const isCodeInstalled = () => test('code --version')
export const assertCodeInstalled = () => {
    if (isCodeInstalled()) return

    Logger.getInstance().error('Please install vscode cli `code`'.red)
    process.exit(1)
}
export const openWithVscode = (directory: string, opts?: { reuse?: boolean }) => {
    assertCodeInstalled()

    Logger.getInstance().log(
        `Opening ${directory.yellow} ${opts?.reuse ? 'in same window' : 'in new window'}...`.dim,
    )
    exec(`code ${opts?.reuse ? '--reuse-window' : ''} ${directory}`)
}

export const isNvimInstalled = () => test('nvim --version')
export const isVimInstalled = () => test('vim --version')

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

export const getRelativePathOf = (pathString: string) => path.relative(process.cwd(), pathString) || './'

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
