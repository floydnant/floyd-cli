import fs from 'fs'
import stripJsonComments from 'strip-json-comments'
import { z } from 'zod'
// eslint-disable-next-line @nx/enforce-module-boundaries
import { interpolateVariables } from '../../../../../packages/common/src'
import { Logger } from '../logger.service'
import { isNvimInstalled, exec, isCodeInstalled } from '../utils'
import { globalConfigSchema } from './config.schemas'
import env from '../../../env.json'
import { globalPaths } from './config.vars'

export const initConfig = () => {
    const rawDefaultConfig = fs.readFileSync(globalPaths.defaultConfigFile, 'utf-8')
    const interpolatedDefaultConfig = interpolateVariables(rawDefaultConfig, { cliVersion: env.VERSION })

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
        // we cannot use the logger here, because it depends on the config

        if (e instanceof z.ZodError) {
            console.error('Config file is invalid:\n'.red)
            console.error(
                e.issues
                    .map(issue => ` - ${issue.message.red} (at config.${issue.path.join('.')})`)
                    .join('\n') + '\n',
            )
            process.exit(1)
        }
        if (e instanceof TypeError) {
            console.error('Config file is invalid:\n'.red)
            console.error(e)
            process.exit(1)
        }

        throw e
    }
}

export const editConfig = () => {
    Logger.getInstance().verbose('Opening config file '.dim, globalPaths.configFile.yellow)

    if (isNvimInstalled()) exec(`nvim ${globalPaths.configFile}`)
    else if (isCodeInstalled()) exec(`code ${globalPaths.configFile}`)
    else exec(`vim ${globalPaths.configFile}`)
}
