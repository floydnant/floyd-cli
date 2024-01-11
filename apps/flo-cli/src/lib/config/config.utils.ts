import fs from 'fs'
import { z } from 'zod'
import env from '../../../env.json'
import { Logger } from '../logger.service'
import { OpenController } from '../open/open.controller'
import { indent } from '../utils'
import { globalConfigSchema } from './config.schemas'
import { DEFAULT_LOG_LEVEL, globalPaths } from './config.vars'
import { InterpolationStrategy, interpolateVariables, stripJsonComments } from '@flo/common'

export const initConfig = () => {
    const rawDefaultConfig = fs.readFileSync(globalPaths.defaultConfigFile, 'utf-8')
    const interpolatedDefaultConfig = interpolateVariables(
        rawDefaultConfig,
        {
            cliVersion: env.VERSION,
            defaultLogLevel: DEFAULT_LOG_LEVEL,
            interpolationStrategies: Object.values(InterpolationStrategy).join(', '),
        },
        InterpolationStrategy.DollarSign,
    ).interpolated

    fs.mkdirSync(globalPaths.configRoot, { recursive: true })
    fs.writeFileSync(globalPaths.configFile, interpolatedDefaultConfig)
}

export const readOrInitConfig = () => {
    try {
        const exists = fs.existsSync(globalPaths.configFile)
        if (!exists) initConfig()

        const rawConfigFile = fs.readFileSync(globalPaths.configFile, 'utf-8')
        const strippedConfigFile = stripJsonComments(rawConfigFile, { trailingCommas: true })
        const parsed = JSON.parse(strippedConfigFile)
        const validated = globalConfigSchema.parse(parsed)

        return { config: validated, rawConfigFile, strippedConfigFile }
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
                                                (unionError.issues[0] as z.ZodInvalidTypeIssue).expected.red
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

// @TODO: this should be in the config service
export const editConfig = () => {
    OpenController.getInstance().openFile(globalPaths.configFile, { subject: 'config file' })
}
