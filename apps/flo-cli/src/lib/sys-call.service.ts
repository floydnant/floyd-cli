import { ExecSyncOptions, execSync } from 'child_process'
import { Logger } from './logger.service'
import { cacheable } from './utils'

export class SysCallService {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {}

    /**
     * `execSync` from `child_process` with logging
     */
    execSync(command: string, options: ExecSyncOptions = {}) {
        Logger.getInstance().debug(`Executing: ${command.cyan}`)
        return execSync(command, options)?.toString()
    }

    /**
     * `execSync` from `child_process` with inherited stdio and logging
     */
    exec(command: string, options: ExecSyncOptions = {}) {
        Logger.getInstance().debug(`Executing: ${command.cyan}`)
        return execSync(command, { stdio: 'inherit', ...options })?.toString()
    }

    /**
     * Returns true if the command was successful
     * Return false if the command failed
     */
    testCommand = cacheable((command: string) => {
        Logger.getInstance().debug(`Testing command: ${command.cyan}`)
        try {
            execSync(command, { stdio: 'ignore' })
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
