import { ExecSyncOptions, execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { Logger } from './logger.service'
import { cacheable } from './utils'
import { isTruthy } from './type-guards'
import { highlightBasename } from './formatting.utils'

export class SysCallService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * `execSync` from `child_process` with debug logging
     */
    exec(command: string, options: ExecSyncOptions = {}) {
        Logger.debug(() => {
            const { cwd, ...restOptions } = options
            const inCwd = cwd && cwd != process.cwd() ? ` in ${highlightBasename(cwd.toString())}` : ''
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
    execPipe(command: string, options: ExecSyncOptions = {}, trimOutput = true) {
        const output = this.exec(command, { ...options, stdio: 'pipe' }).toString()
        if (!trimOutput) return output

        return output.trim()
    }

    getLastModified = cacheable(async (path: string) => {
        const stats = await this.stat(path)
        return stats.mtime
    })
    getLastModifiedFor = cacheable(async (paths: string[]) => {
        const modificationDateEntries = await Promise.all(
            paths.map(async file => [file, await this.getLastModified(file).catch(() => null)] as const),
        )

        // Find the latest modification time among files and subfolders
        const lastModified = modificationDateEntries
            .filter((entry): entry is [string, Date] => isTruthy(entry[1]))
            // @TODO: do this with a sort instead
            .reduce((maxTime, [, lastModifiedAt]) => {
                return Math.max(maxTime, lastModifiedAt.valueOf())
            }, 0)

        return {
            latest: new Date(lastModified),
            files: modificationDateEntries,
        }
    })
    /**
     * Get the last modified date of a directory recursively.
     *
     * Ignores files and folders that match the given `ignorePaths`. By default, `node_modules`, `dist` and `bin` are ignored.
     */
    getLastModifiedRecursive = cacheable(
        async (directory: string, ignorePaths: string[] = ['node_modules', 'dist', 'bin']) => {
            Logger.debug(`Reading directory recursively ${directory.green}`)

            const files = await fs.readdir(directory, { recursive: true })
            const modificationDates = await Promise.all(
                files
                    .filter(file => !ignorePaths.some(ignorePath => file.startsWith(ignorePath)))
                    .map(file => this.getLastModified(path.join(directory, file))),
            )

            // Find the latest modification time among files and subfolders
            const lastModified = modificationDates.reduce((maxTime, lastModified) => {
                return Math.max(maxTime, lastModified.valueOf())
            }, 0)

            return new Date(lastModified)
        },
    )

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
        Logger.debug(`Reading text file: ${highlightBasename(file)}`)
        return await fs.readFile(file, 'utf-8')
    }
    writeTextFile = async (file: string, content: string) => {
        Logger.debug(`Writing text file: ${highlightBasename(file)}`)
        return await fs.writeFile(file, content)
    }
    stat = async (file: string) => {
        Logger.debug(`Getting file stats: ${highlightBasename(file)}`)
        return await fs.stat(file)
    }
    exists = async (file: string) => {
        return await this.stat(file)
            .then(() => true)
            .catch(() => false)
    }
    mkdir = async (directory: string) => {
        Logger.debug(`Making directory: ${highlightBasename(directory)}`)
        return await fs.mkdir(directory, { recursive: true })
    }

    private static instance = new SysCallService()
    static getInstance() {
        if (!this.instance) throw new Error(`${SysCallService.name} not initialized`)
        return this.instance
    }
}
