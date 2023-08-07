export enum LogLevel {
    QUIET = 'quiet',
    ERROR = 'error',
    WARN = 'warn',
    LOG = 'log',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
}

export class Logger {
    private static instance: Logger
    private constructor(private logLevel: LogLevel) {}

    static init(logLevel: LogLevel) {
        Logger.instance = new Logger(logLevel)
        return Logger.instance
    }

    static getInstance(): Logger {
        if (!Logger.instance) throw new Error('Logger not initialized')

        return Logger.instance
    }

    error(message: string, ...args: unknown[]) {
        if (
            [LogLevel.DEBUG, LogLevel.VERBOSE, LogLevel.LOG, LogLevel.WARN, LogLevel.ERROR].includes(
                this.logLevel,
            )
        )
            console.error(message.red, ...args)
    }
    warn(...args: unknown[]) {
        if ([LogLevel.DEBUG, LogLevel.VERBOSE, LogLevel.LOG, LogLevel.WARN].includes(this.logLevel))
            console.warn(...args)
    }
    log(...args: unknown[]) {
        if ([LogLevel.DEBUG, LogLevel.VERBOSE, LogLevel.LOG].includes(this.logLevel)) console.log(...args)
    }
    verbose(message: string, ...args: unknown[]) {
        if ([LogLevel.DEBUG, LogLevel.VERBOSE].includes(this.logLevel)) console.log(message.dim, ...args)
    }
    debug(...args: unknown[]) {
        if (LogLevel.DEBUG == this.logLevel) console.debug('DEBUG:'.bgYellow.black, ...args)
    }
}
