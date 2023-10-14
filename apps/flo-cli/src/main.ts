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
import { ConfigService } from './lib/config/config.service'
import { LogLevel, Logger } from './lib/logger.service'
import { projectsCommand } from './cli/projects'
import { SysCallService } from './lib/sys-call.service'
import { GitRepository } from './adapters/git'

const cli = new Command()

cli.version(env.VERSION)
cli.showSuggestionAfterError(true)

cli.addCommand(configCommand)
cli.addCommand(runCommand)
cli.addCommand(worktreesCommand)
cli.addCommand(checksCommand)
cli.addCommand(timeCommand)
cli.addCommand(projectsCommand)

cli.option('--debug', 'enable debug logging', false)
cli.hook('preAction', thisCommand => {
    const sysCallService = SysCallService.getInstance()
    const gitRepo = GitRepository.init(sysCallService)
    const configService = ConfigService.init(gitRepo)

    const logLevel = thisCommand.opts()['debug'] ? LogLevel.DEBUG : configService.config.logLevel
    Logger.updateLogLevel(logLevel)
    Logger.debug('Debug logging enabled')
})

cli.parse(process.argv)
