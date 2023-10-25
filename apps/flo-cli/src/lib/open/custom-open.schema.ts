import { z } from 'zod'
import { OpenType } from './open.types'

export const customOpenPortConfigSchema = z.object({
    name: z.string(),
    command: z.string().describe('Occurence of `{{ url }}` will be interpolated, e.g. `code {{ url }}`'),
    reuseWindowCommand: z
        .string()
        .optional()
        .describe('Command to use when wanting to reuse a window, e.g. `code {{ url }} --reuse-window`'),
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
    supportedTypes: z
        .array(z.nativeEnum(OpenType))
        .default(Object.values(OpenType))
        .describe('What types of urls this app supports'),
})
export type CustomOpenPortConfig = z.infer<typeof customOpenPortConfigSchema>
