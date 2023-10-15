import { ExecSyncOptions, execSync } from 'child_process'
import { Logger } from './logger.service'
import { cacheable } from './utils'

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
        return execSync(command, options)?.toString()
    }

    /**
     * `execSync` from `child_process` with inherited stdio and debug logging
     */
    execInherit(command: string, options: ExecSyncOptions = {}) {
        return this.exec(command, { ...options, stdio: 'inherit' })
    }

    /**
     * `execSync` from `child_process` with piped stdio and debug logging
     */
    execPipe(command: string, options: ExecSyncOptions = {}) {
        return this.exec(command, { ...options, stdio: 'pipe' })
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

    private static instance = new SysCallService()
    static getInstance() {
        if (!this.instance) throw new Error(`${SysCallService.name} not initialized`)
        return this.instance
    }
}
