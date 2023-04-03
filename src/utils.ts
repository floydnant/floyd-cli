import { execSync } from 'child_process'
import 'colors'
import path from 'path'

export const exec = (command: string) => execSync(command, { stdio: 'inherit' })

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

    console.log('Please install gh cli with `brew install gh`'.red)
    process.exit(1)
}

export const isCodeInstalled = () => test('code --version')
export const assertCodeInstalled = () => {
    if (isCodeInstalled()) return

    console.log('Please install vscode cli `code`'.red)
    process.exit(1)
}
export const openWithVscode = (directory: string, opts?: { reuse?: boolean }) => {
    assertCodeInstalled()

    console.log(`Opening ${directory.yellow} ${opts?.reuse ? 'in same window' : 'in new window'}...`.dim)
    exec(`code ${opts?.reuse ? '-r' : ''} ${directory}`)
}

export const isNvimInstalled = () => test('nvim --version')
export const isVimInstalled = () => test('vim --version')

export const getWorkingDir = () => process.cwd()
export const isSubDir = (dir: string, parentDir: string) => {
    const relative = path.relative(parentDir, dir)
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

export const indent = (str: string, spaces = 4) =>
    str
        .split('\n')
        .map(line => ' '.repeat(spaces) + line)
        .join('\n')

export const getPaddedStr = (str: string) => {
    const DISPLAY_LENGTH = process.stdout.columns

    const length = DISPLAY_LENGTH - str.stripColors.length - 1
    if (length < 1) return ''
    return str + ' ' + '-'.repeat(length).dim
}

export type UnwrapArray<T> = T extends (infer U)[] ? U : never
