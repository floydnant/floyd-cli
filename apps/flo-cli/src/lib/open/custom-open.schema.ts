import { z } from 'zod'
import { OpenType } from './open.types'

export const customOpenPortConfigSchema = z
    .object({
        name: z.string(),
        command: z.string().describe('Occurence of `{{ url }}` will be interpolated, e.g. `code {{ url }}`'),
        supportedTypes: z.nativeEnum(OpenType).array().describe('What types of urls this app supports'),

        alwaysReusesWindow: z.boolean().default(false).describe('Whether this app reuses windows by default'),
        reuseWindow: z
            .object({
                command: z
                    .string()
                    .describe(
                        'Command to use when wanting to reuse a window, e.g. `code {{ directory }} --reuse-window`',
                    ),
                supportedTypes: z
                    .nativeEnum(OpenType)
                    .array()
                    .optional()
                    .describe('What types of urls this app supports when reusing a window'),
            })
            .optional(),

        alwaysWaitsForClose: z
            .boolean()
            .default(false)
            .describe('Whether this app waits for close by default'),
        waitForClose: z
            .object({
                command: z
                    .string()
                    .describe(
                        'Command to use when wanting to wait for the app to close before continuing, e.g. `code {{ file }} --wait` or all terminal based editors',
                    ),
                supportedTypes: z
                    .nativeEnum(OpenType)
                    .array()
                    .optional()
                    .describe('What types of urls this app supports when waiting for close'),
            })
            .optional(),

        checkInstalledCommand: z
            .string()
            .optional()
            .describe('Command to check wether the app is installed, e.g. `vim --version`'),
        checkInstalledApp: z
            .string()
            .optional()
            .describe(
                'Application identifier to search for when checking wether the app is installed, e.g. `Visual Studio Code.app`',
            ),
    })
    .transform(data => {
        const reuseWindow = data.alwaysReusesWindow ? { command: data.command } : data.reuseWindow
        const waitForClose = data.alwaysWaitsForClose ? { command: data.command } : data.waitForClose

        return {
            ...data,

            canReuseWindow: !!reuseWindow?.command,
            reuseWindow: reuseWindow && {
                ...reuseWindow,
                supportedTypes: reuseWindow.supportedTypes || data.supportedTypes,
            },

            canWaitForClose: !!waitForClose?.command,
            waitForClose: waitForClose && {
                ...waitForClose,
                supportedTypes: waitForClose.supportedTypes || data.supportedTypes,
            },
        }
    })

export type CustomOpenPortConfig = z.infer<typeof customOpenPortConfigSchema>
export type CustomOpenPortConfigInput = z.input<typeof customOpenPortConfigSchema>
