#!/usr/bin/env node

import '@total-typescript/ts-reset'
import 'colors'
import { Command } from 'commander'
import env from '../env.json'
import { checksCommand } from './cli/checks'
import { configCommand } from './cli/config'
import { timeCommand } from './cli/time-tracking'
import { runCommand } from './cli/workflows'
import { worktreesCommand } from './cli/worktrees'
import { LogLevel, Logger } from './lib/logger'
import { DEFAULT_LOG_LEVEL } from './lib/config'

const cli = new Command()

cli.version(env.VERSION)
cli.showSuggestionAfterError(true)

cli.addCommand(configCommand)
cli.addCommand(runCommand)
cli.addCommand(worktreesCommand)
cli.addCommand(checksCommand)
cli.addCommand(timeCommand)

cli.option('--debug', 'enable debug logging', false)
cli.hook('preAction', thisCommand => {
    const logLevel = thisCommand.opts()['debug'] ? LogLevel.DEBUG : DEFAULT_LOG_LEVEL
    const logger = Logger.init(logLevel)
    if (logLevel == LogLevel.DEBUG) logger.log('Debug logging enabled')
})

cli.parse(process.argv)
