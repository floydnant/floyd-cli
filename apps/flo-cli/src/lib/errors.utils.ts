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
