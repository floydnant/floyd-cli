import { interpolateVariables, InterpolationStrategy, stripJsonComments } from '@flo/common'
import { env } from 'process'
import { z } from 'zod'
import { Logger } from '../logger.service'
import { SysCallService } from '../sys-call.service'
import { indent } from '../utils'
import { Config, globalConfigSchema } from './config.schemas'
import { DEFAULT_LOG_LEVEL, globalPaths } from './config.vars'

// @TODO: @floydnant we can read local configs easily by checking the current worktreeRoot for `.flo-cli/`
// or fall back to manually traversing if no git repo is used

export class ConfigService {
    /** Do not use this constructor directly, use `ConfigService.init()` instead */
    constructor(private sysCallService: SysCallService) {}

    private config_?: Config
    get config(): Readonly<Config> {
        if (!this.config_) throw new Error('Config not initialized')
        return this.config_
    }

    private rawConfigFile_?: string
    get rawConfigFile(): string {
        if (!this.rawConfigFile_) throw new Error('Config not initialized')
        return this.rawConfigFile_
    }

    // @TODO: Come up with a way to update config files without
    // - overwriting comments
    // - mixing up the order of the keys
    // - mixing up local and global config

    async initConfig() {
        const { config, rawConfigFile } = await this.readOrInitConfigFile()
        this.config_ = config
        this.rawConfigFile_ = rawConfigFile
    }

    private async readOrInitConfigFile() {
        try {
            const exists = await this.sysCallService.exists(globalPaths.configFile)
            if (!exists) await this.initConfigFile()

            const rawConfigFile = await this.sysCallService.readTextFile(globalPaths.configFile)
            const stripped = stripJsonComments(rawConfigFile, { trailingCommas: true })
            const parsed = JSON.parse(stripped)
            const validated = globalConfigSchema.parse(parsed)

            return { config: validated, rawConfigFile, strippedConfigFile: stripped }
        } catch (e) {
            if (e instanceof z.ZodError) {
                Logger.error('Config file is invalid:\n'.red)
                Logger.error(
                    e.issues
                        .map(issue => {
                            const message = ` - ${issue.message.red} (at config.${issue.path.join('.')})`

                            if ('unionErrors' in issue)
                                return (
                                    message +
                                    ' -> One of these must apply\n' +
                                    issue.unionErrors
                                        .map(unionError =>
                                            indent(
                                                ` - config.${unionError.issues[0]?.path.join('.')}: ${
                                                    (unionError.issues[0] as z.ZodInvalidTypeIssue).expected
                                                        .red
                                                }`,
                                            ),
                                        )
                                        .join('\n')
                                )

                            return message
                        })
                        .join('\n') + '\n',
                )
                console.error(e)
                Logger.error(`Please fix it and try again. File is at ${globalPaths.configFile}`.red)
                process.exit(1)
            }
            if (e instanceof SyntaxError) {
                Logger.error(`Config file is invalid: ${e.message}`.red)
                Logger.error(`Please fix it and try again. File is at ${globalPaths.configFile}`.red)
                process.exit(1)
            }

            throw e
        }
    }

    private async initConfigFile() {
        const rawDefaultConfig = await this.sysCallService.readTextFile(globalPaths.defaultConfigFile)
        const interpolatedDefaultConfig = interpolateVariables(
            rawDefaultConfig,
            {
                cliVersion: env.VERSION,
                defaultLogLevel: DEFAULT_LOG_LEVEL,
                interpolationStrategies: Object.values(InterpolationStrategy).join(', '),
            },
            InterpolationStrategy.DollarSign,
        ).interpolated

        await this.sysCallService.mkdir(globalPaths.configRoot)
        await this.sysCallService.writeTextFile(globalPaths.configFile, interpolatedDefaultConfig)
    }

    private static instance: ConfigService
    static init(...args: ConstructorParameters<typeof ConfigService>) {
        this.instance = new ConfigService(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${ConfigService.name} not initialized`)
        return this.instance
    }
}
