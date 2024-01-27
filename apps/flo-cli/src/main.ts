#!/usr/bin/env node

import '@total-typescript/ts-reset'
import 'colors'
import { Command } from 'commander'
import env from '../env.json'
import { GitRepository } from './adapters/git'
import { matchGitError } from './adapters/git/git.errors'
import { checksCommand } from './cli/checks'
import { configCommand } from './cli/config'
import { projectsCommand } from './cli/projects'
import { timeCommand } from './cli/time-tracking'
import { runCommand } from './cli/workflows'
import { worktreesCommand } from './cli/worktrees'
import { ConfigService } from './lib/config/config.service'
import { ContextService } from './lib/config/context.service'
import { Exception } from './lib/errors.utils'
import { GitController } from './lib/git.controller'
import { GitService } from './lib/git.service'
import { Logger, customErrorWriter, fatalPrefix } from './lib/logger.service'
import { LogLevel } from './lib/logger.types'
import { OpenController } from './lib/open/open.controller'
import { OpenService } from './lib/open/open.service'
import { PromptController } from './lib/prompt.controller'
import { SysCallService } from './lib/sys-call.service'
import { DEFAULT_LOG_LEVEL } from './lib/config/config.vars'

const cli = new Command()

cli.version(env.VERSION)
cli.showSuggestionAfterError(true)
cli.configureOutput(customErrorWriter)

cli.addCommand(configCommand)
cli.addCommand(runCommand)
cli.addCommand(worktreesCommand)
cli.addCommand(checksCommand)
cli.addCommand(timeCommand)
cli.addCommand(projectsCommand)

cli.option('--debug', 'enable debug logging', false)
cli.hook('preAction', async thisCommand => {
    const logLevel = thisCommand.opts()['debug'] ? LogLevel.DEBUG : DEFAULT_LOG_LEVEL
    Logger.updateLogLevel(logLevel)
    Logger.debug('Debug logging enabled')

    const sysCallService = SysCallService.getInstance()
    const configService = ConfigService.init(sysCallService)
    await configService.initConfig()
    // If debug logging is not enabled, we update the log level to the one specified in the config
    if (!thisCommand.opts()['debug']) Logger.updateLogLevel(configService.config.logLevel)

    const gitRepo = GitRepository.init(sysCallService)
    const promptController = PromptController.init()
    const gitService = GitService.init(gitRepo)
    GitController.init(gitRepo, gitService, promptController)
    ContextService.init(gitRepo, configService)
    OpenController.init(OpenService.init(sysCallService, configService), configService, promptController)
})

const main = async () => {
    try {
        await cli.parseAsync(process.argv)
    } catch (e) {
        const error = matchGitError(e) ?? e

        if (error instanceof Error) {
            Logger.log()
            Logger.error(fatalPrefix, error.message.red)

            if (error instanceof Exception && error.originalMessage) {
                Logger.verbose(error.originalMessage.trim())
            }

            Logger.debug(error)

            const exitCode = error instanceof Exception && error.exitCode ? error.exitCode : 1
            process.exit(exitCode)
        }

        Logger.error(fatalPrefix, 'Unknown error'.red)
        Logger.debug(error)
        process.exit(1)
    }
}

main()
