#!/usr/bin/env node

import { Command } from 'commander'
import 'colors'
import prompts from 'prompts'

const cli = new Command()

// @FIXME: we dont have access to the env vars, when running the compiled code
cli.version(process.env.npm_package_version || 'x.x.x')

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

cli.parse(process.argv)
