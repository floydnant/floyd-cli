import { ExecSyncOptions, execSync } from 'child_process'
import { Logger } from './logger.service'
import { cacheable } from './utils'
import fs from 'fs/promises'

export class SysCallService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * `execSync` from `child_process` with debug logging
     */
    exec(command: string, options: ExecSyncOptions = {}) {
        Logger.debug(() => {
            const { cwd, ...restOptions } = options
            const inCwd = cwd && cwd != process.cwd() ? ` in ${cwd.toString().green}` : ''
            return [
                `Executing: ${command.cyan}${inCwd}`,
                ...(Object.keys(restOptions).length > 0 ? ['with options:', restOptions] : []),
            ]
        })
        return execSync(command, options)
    }

    /**
     * `execSync` from `child_process` with inherited stdio and debug logging
     */
    execInherit(command: string, options: ExecSyncOptions = {}) {
        return this.exec(command, { ...options, stdio: 'inherit' })
    }

    /**
     * `execSync` from `child_process` with piped stdio and debug logging
     *
     * The output is trimmed and returned as a string
     */
    execPipe(command: string, options: ExecSyncOptions = {}) {
        return this.exec(command, { ...options, stdio: 'pipe' })
            ?.toString()
            .trim()
    }

    /**
     * - Returns true if the command was successful
     * - Returns false if the command failed
     */
    testCommand = cacheable((command: string) => {
        try {
            this.exec(command, { stdio: 'ignore' })
            return true
        } catch {
            return false
        }
    })

    /**
     * - Returns true if the application is installed (one or more matched fileNames)
     * - Returns false if the command failed or 0 fileNames matched
     */
    testApplication = cacheable((appFileName: string) => {
        try {
            // const lines = this.execSync(`mdfind -name '${appFileName}' -count`, { stdio: 'pipe' }).split('\n')
            const lines = this.execPipe(
                `mdfind "kMDItemKind == 'Application'" | grep '${appFileName}'`,
            ).split('\n')

            return lines.length > 0
        } catch {
            return false
        }
    })

    readTextFile = async (file: string) => {
        Logger.debug(`Reading text file: ${file}`)
        return await fs.readFile(file, 'utf-8')
    }
    writeTextFile = async (file: string, content: string) => {
        Logger.debug(`Writing text file: ${file}`)
        return await fs.writeFile(file, content)
    }
    stat = async (file: string) => {
        Logger.debug(`Getting file stats: ${file}`)
        return await fs.stat(file)
    }
    exists = async (file: string) => {
        return await this.stat(file)
            .then(() => true)
            .catch(() => false)
    }
    mkdir = async (directory: string) => {
        Logger.debug(`Making directory: ${directory}`)
        return await fs.mkdir(directory, { recursive: true })
    }

    private static instance = new SysCallService()
    static getInstance() {
        if (!this.instance) throw new Error(`${SysCallService.name} not initialized`)
        return this.instance
    }
}
