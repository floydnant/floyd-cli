import { z } from 'zod'
import { harvestConfigSchema, personioConfigSchema } from '../adapters'

export const wokBalanceConfigSchema = z.object({
    ...harvestConfigSchema.shape,
    ...personioConfigSchema.shape,
})
export type WokBalanceConfig = z.infer<typeof wokBalanceConfigSchema>
