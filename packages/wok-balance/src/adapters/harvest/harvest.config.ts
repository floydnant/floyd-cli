import { z } from 'zod'

export const harvestConfigSchema = z.object({
    HARVEST_API_TOKEN: z.string(),
    HARVEST_ACCOUNT_ID: z.number({ coerce: true }),
    HARVEST_BASE_URL: z.string().url().default('https://api.harvestapp.com/api/v2'),
})
export type HarvestConfig = z.infer<typeof harvestConfigSchema>
