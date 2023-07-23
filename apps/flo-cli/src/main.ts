#!/usr/bin/env node

import 'colors'
import { Command } from 'commander'
import prompts from 'prompts'
import env from '../env.json'
import { checksCommand } from './cli/checks'
import { runCommand } from './cli/workflows/run.command'
import { worktreesCommand } from './cli/worktrees'
import { editConfig, readConfig } from './config'
import { wokBalanceCommand } from './cli/balance'

const cli = new Command()

cli.version(env.VERSION)
cli.showSuggestionAfterError(true)

cli.command('hello')
    .argument('[name]', 'Your name')
    .option('-e, --earth')
    .option('-i, --input <string>')
    .action((name, opts: { earth?: boolean; input?: string }) => {
        console.log(`Hello ${(name || (opts.earth ? 'Earth' : 'World')).rainbow}!`)
        if (opts.input) console.log('You said', opts.input.bgMagenta.black)

        const result = prompts({
            type: 'select',
            name: 'what-next',
            message: 'What next?',
            choices: [
                { title: 'Code', value: 'code' },
                { title: 'Sleep', value: 'sleep' },
                { title: 'Make Music', value: 'make-music' },
                { title: 'Go biking', value: 'go-biking' },
                { title: 'Take a puff', value: 'take-a-puff' },
            ],
        })
        result.then(res => {
            console.log(res)
        })
    })

cli.addCommand(runCommand)
cli.addCommand(worktreesCommand)
cli.addCommand(checksCommand)
cli.addCommand(wokBalanceCommand)

cli.command('conf')
    .description('Shows the resolved config')
    .option('-e, --edit', 'Opens the config file in your editor')
    .action((opts: { edit?: boolean }) => {
        if (opts.edit) editConfig()
        else console.log(readConfig())
    })

cli.parse(process.argv)
