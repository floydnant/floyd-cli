import { DEFAULT_LOG_LEVEL } from './config/config.vars'

export enum LogLevel {
    QUIET = 'quiet',
    ERROR = 'error',
    WARN = 'warn',
    LOG = 'log',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
}

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

    static debug = ((...args: unknown[]) => {
        if (LogLevel.DEBUG == Logger.logLevel) console.debug('DEBUG:'.bgYellow.black, ...args)
        return Logger
    }).bind(Logger) as (...agrs: unknown[]) => typeof Logger
}
