import { DEFAULT_LOG_LEVEL } from './config/config.vars'
import { LogLevel } from './logger.types'

export class Logger {
    private static logLevel = DEFAULT_LOG_LEVEL

    static updateLogLevel(logLevel: LogLevel) {
        Logger.logLevel = logLevel
        return Logger
    }

    // just for migration purposes
    static getInstance() {
        return Logger
    }

    // Sorry this is unreadable and uggly as hell, but idc rn

    static error = ((message: string, ...args: unknown[]) => {
        if (
            [LogLevel.DEBUG, LogLevel.VERBOSE, LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR].includes(
                Logger.logLevel,
            )
        )
            console.error(message.red, ...args)
        return Logger
    }).bind(Logger) as (message: string, ...agrs: unknown[]) => typeof Logger

    static warn = ((...args: unknown[]) => {
        if ([LogLevel.DEBUG, LogLevel.VERBOSE, LogLevel.LOG, LogLevel.WARN].includes(Logger.logLevel))
            console.warn(...args)
        return Logger
    }).bind(Logger) as (...agrs: unknown[]) => typeof Logger

    static log = ((...args: unknown[]) => {
        if ([LogLevel.DEBUG, LogLevel.VERBOSE, LogLevel.LOG].includes(Logger.logLevel)) console.log(...args)
        return Logger
    }).bind(Logger) as (...agrs: unknown[]) => typeof Logger

    static verbose = ((message: string, ...args: unknown[]) => {
        if ([LogLevel.DEBUG, LogLevel.VERBOSE].includes(Logger.logLevel)) console.info(message.dim, ...args)
        return Logger
    }).bind(Logger) as (message: string, ...agrs: unknown[]) => typeof Logger

    static debug = ((message: string | (() => string | [string, ...unknown[]]), ...args: unknown[]) => {
        if (LogLevel.DEBUG != Logger.logLevel) return

        const messageResult = typeof message === 'function' ? message() : message
        const messageAndMore = Array.isArray(messageResult) ? messageResult : [messageResult]
        console.debug('DEBUG:'.bgYellow.black, ...messageAndMore, ...args)

        return Logger
    }).bind(Logger) as (...agrs: unknown[]) => typeof Logger
}
