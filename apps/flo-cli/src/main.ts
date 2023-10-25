#!/usr/bin/env node

import '@total-typescript/ts-reset'
import 'colors'
import { Command } from 'commander'
import env from '../env.json'
import { GitRepository } from './adapters/git'
import { checksCommand } from './cli/checks'
import { configCommand } from './cli/config'
import { projectsCommand } from './cli/projects'
import { timeCommand } from './cli/time-tracking'
import { runCommand } from './cli/workflows'
import { worktreesCommand } from './cli/worktrees'
import { ConfigService } from './lib/config/config.service'
import { ContextService } from './lib/config/context.service'
import { gracefullyHandle } from './lib/errors.utils'
import { GitController } from './lib/git.controller'
import { GitService } from './lib/git.service'
import { Logger } from './lib/logger.service'
import { LogLevel } from './lib/logger.types'
import { OpenController } from './lib/open/open.controller'
import { OpenService } from './lib/open/open.service'
import { PromptController } from './lib/prompt.controller'
import { SysCallService } from './lib/sys-call.service'

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
    const promptController = PromptController.init()
    const gitService = GitService.init(gitRepo)
    GitController.init(gitRepo, gitService, promptController)
    ContextService.init(gitRepo)
    const configService = ConfigService.init()
    OpenController.init(OpenService.init(sysCallService, configService), configService)

    const logLevel = thisCommand.opts()['debug'] ? LogLevel.DEBUG : configService.config.logLevel
    Logger.updateLogLevel(logLevel)
    Logger.debug('Debug logging enabled')
})

gracefullyHandle(() => cli.parseAsync(process.argv))
