import { Command } from 'commander'
import { copyFileSync, existsSync, writeFileSync } from 'fs'
import prompts from 'prompts'
import { getConfigFilePath } from '../config'
import { exec, getWorkingDir } from '../utils'

const workingDir = getWorkingDir()

const initPrettierHandler = async (opts: { yes?: boolean; yesyes?: boolean }) => {
    if (!opts.yes) {
        console.log('I will now do the following:')
        console.log('  - Create a .prettierrc')
        console.log('  - Run `npm i -D prettier`')
        console.log('  - Run `npx prettier --write .`')
        console.log()

        const { confirmOperation } = await prompts({
            name: 'confirmOperation',
            type: 'confirm',
            message: 'Is that alright?',
        })
        if (!confirmOperation) return
    }

    console.log('\nCreating config file...'.dim)
    copyFileSync(getConfigFilePath('.prettierrc'), `${workingDir}/.prettierrc`)

    console.log('\nInstalling prettier...'.dim)
    exec('npm i -D prettier')

    if (!opts.yesyes) {
        console.log('\n   "format": "prettier --write .",\n'.yellow)
        const { confirmPackageJson } = await prompts({
            name: 'confirmPackageJson',
            type: 'confirm',
            message: 'Shall I add this format script to your package.json?',
        })
        if (!confirmPackageJson) {
            console.log('\nSuit yourself then!, still running prettier though...'.dim)
            exec('npx prettier --write .')
            console.log('\nDone!'.green)
            return
        }
    }

    console.log('\nAdding formatting script...'.dim)
    const packageJson = require(`${workingDir}/package.json`)
    packageJson.scripts = packageJson.scripts || {}
    packageJson.scripts.format = 'prettier --write .'
    writeFileSync(`${workingDir}/package.json`, JSON.stringify(packageJson, null, 4))

    console.log('\nRunning prettier...'.dim)
    exec('npx prettier --write .')
    console.log('\nDone!'.green)
}

const initTsHandler = async () => {
    console.log('\nInstalling typescript...'.dim)
    exec('npm i -D typescript @types/node')

    console.log('\nCreating tsconfig.json...'.dim)
    copyFileSync(getConfigFilePath('tsconfig.json'), `${workingDir}/tsconfig.json`)

    console.log('\nDone!'.green)
}

export const setupInitCommands = (cli: Command) => {
    const initTypescript = cli.createCommand('ts').action(initTsHandler)

    const initPrettier = cli
        .createCommand('prettier')
        .option('-y, --yes', 'Skip confirmation')
        .option('-yy, --yesyes', 'Skip second confirmation')
        .action(initPrettierHandler)

    cli.command('init')
        .addCommand(initPrettier)
        .addCommand(initTypescript)
        .action(() => {
            const isNpmWorkspace = existsSync(workingDir + '/package.json')
            if (!isNpmWorkspace) exec('npm init -y')

            initTsHandler()
            initPrettierHandler({ yes: true, yesyes: true })
        })
}
