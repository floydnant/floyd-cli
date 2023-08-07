import path from 'path'
import { LogLevel } from '../logger.service'

export const DEFAULT_LOG_LEVEL = LogLevel.VERBOSE

export const configFolderName = '.flo-cli'
export const configFileName = 'flo-cli.jsonc'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const home = process.env['HOME']!

const globalConfigRoot = path.join(home, '.config', configFolderName)
const globalConfigFile = path.join(globalConfigRoot, configFileName)

const cliRoot = path.join(__dirname, '../')

const defaultConfigRoot = path.join(cliRoot, 'apps/flo-cli/src/assets/default-configs/')
const defaultConfigFile = path.join(defaultConfigRoot, configFileName)

export const globalPaths = {
    home,
    cliRoot,

    configRoot: globalConfigRoot,
    configFile: globalConfigFile,

    defaultConfigRoot,
    defaultConfigFile,
}
