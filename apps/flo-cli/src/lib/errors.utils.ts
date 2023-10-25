import { Logger } from './logger.service'

export abstract class Exception extends Error {
    static regex: RegExp
    class!: typeof Exception
    code!: string
    exitCode?: number

    constructor(
        public originalMessage: string,
        public message: string,
    ) {
        super(message)
    }
}

export const matchError = (
    error: unknown,
    errorRegex: RegExp,
): { isMatch: boolean; groups: Record<string | number, string | undefined>; originalMessage: string } => {
    const originalMessage = error instanceof Error ? error.message : String(error)
    const match = originalMessage.match(errorRegex)

    return {
        isMatch: !!match,
        groups: match?.groups || {},
        originalMessage,
    }
}

export interface CustomExceptionConstructor {
    fromError(error: unknown): Exception | null
}

export const gracefullyHandle = async (callback: () => unknown | Promise<unknown>) => {
    try {
        await callback()
    } catch (e) {
        if (e instanceof Error) {
            Logger.error('FATAL:'.bgRed.black, e.message.red)
            Logger.debug(e)

            if (e instanceof Exception && e.exitCode) process.exit(e.exitCode)
            else process.exit(1)
        }
        Logger.error('FATAL:'.bgRed.black, 'Unknown error'.red)
        Logger.debug(e)
        process.exit(1)
    }
}
