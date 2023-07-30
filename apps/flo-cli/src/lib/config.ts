import { existsSync } from 'fs'
import path from 'path'
import defaultConfigMap from '../assets/default-configs/index.json'
import { exec, isCodeInstalled, isNvimInstalled } from './utils'
import 'colors'
import { Workflow } from '../cli/workflows/run.command'
import { LogLevel } from './logger'

export const DEFAULT_LOG_LEVEL = LogLevel.VERBOSE

// @TODO: Manage config with `configStore` package

const configPath = '~/.config/.flo-cli/config.json'

export const doesConfigExist = () => {
    return existsSync(configPath)
}

interface Config {
    defaultConfigMap: typeof defaultConfigMap
}
// @TODO: whats with this?
interface Config_ {
    files?: Record<string, string> & typeof defaultConfigMap
    workflows?: Workflow[]
}

const resolvedDefaultConfigMap = Object.fromEntries(
    Object.entries(defaultConfigMap).map(([configName, relativeConfigPath]) => {
        const absoluteConfigPath = path.join(__dirname, '../default-configs/', relativeConfigPath)
        return [configName, absoluteConfigPath]
    }),
) as Config['defaultConfigMap']

let cachedConfig: Config | null = null
export const readConfig = (): Config => {
    if (cachedConfig) return cachedConfig

    if (!doesConfigExist()) {
        cachedConfig = { defaultConfigMap: resolvedDefaultConfigMap }
        return cachedConfig
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require(configPath)
    config.defaultConfigMap = {
        ...resolvedDefaultConfigMap,
        ...config.defaultConfigMap,
    }

    cachedConfig = config
    return config
}

export const editConfig = () => {
    console.log('Opening config file '.dim, configPath.yellow)

    if (isNvimInstalled()) exec(`nvim ${configPath}`)
    else if (isCodeInstalled()) exec(`code ${configPath}`)
    else exec(`vim ${configPath}`)
}

export type ConfigFile = keyof typeof defaultConfigMap

export const getConfigFilePath = (configName: ConfigFile) => {
    return readConfig().defaultConfigMap[configName]
}
