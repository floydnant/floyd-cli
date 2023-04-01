import { execSync } from 'child_process'
import 'colors'

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

    console.log('Please install gh cli first'.red)
    process.exit(1)
}
export const isCodeInstalled = () => test('code --version')
export const isNvimInstalled = () => test('nvim --version')
export const isVimInstalled = () => test('vim --version')

export const getWorkingDir = () => execSync('pwd').toString().trim()
