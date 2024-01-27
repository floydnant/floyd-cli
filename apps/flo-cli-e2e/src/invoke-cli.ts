import { join } from 'path'
import packageJson from 'package.json'

export const floBinPath = join(__dirname, '../../../', packageJson.bin.flo)
export const floCommand = `node ${floBinPath}`
