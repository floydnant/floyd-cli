#!/usr/bin/env node

import 'colors'
import { Command } from 'commander'
import env from '../env.json'
import { checksCommand } from './cli/checks'
import { configCommand } from './cli/config'
import { timeCommand } from './cli/time-tracking'
import { runCommand } from './cli/workflows'
import { worktreesCommand } from './cli/worktrees'

const cli = new Command()

cli.version(env.VERSION)
cli.showSuggestionAfterError(true)

cli.addCommand(configCommand)
cli.addCommand(runCommand)
cli.addCommand(worktreesCommand)
cli.addCommand(checksCommand)
cli.addCommand(timeCommand)

cli.parse(process.argv)
