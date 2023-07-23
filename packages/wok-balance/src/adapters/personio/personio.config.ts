import { z } from 'zod'

export const personioConfigSchema = z.object({
    PERSONIO_API_TOKEN: z.string(),
    PERSONIO_BASE_URL: z.string().default('<none>'),
})
export type PersonioConfig = z.infer<typeof personioConfigSchema>
