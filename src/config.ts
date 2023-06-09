import { existsSync } from 'fs'
import path from 'path'
import defaultConfigMap from '../default-configs/index.json'
import { exec, isCodeInstalled, isNvimInstalled } from './utils'
import 'colors'

const configPath = '~/.config/.flo-cli/config.json'

export const doesConfigExist = () => {
    return existsSync(configPath)
}

interface Config {
    defaultConfigMap: typeof defaultConfigMap
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

export const getConfigFilePath = (configName: keyof typeof defaultConfigMap) => {
    return readConfig().defaultConfigMap[configName]
}
