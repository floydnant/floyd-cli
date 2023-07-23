import { z } from 'zod'
import { harvestConfigSchema } from '../adapters/harvest/harvest.config'
import { personioConfigSchema } from '../adapters/personio/personio.config'

export const wokBalanceConfigSchema = z.object({
    ...harvestConfigSchema.shape,
    ...personioConfigSchema.shape,
})
export type WokBalanceConfig = z.infer<typeof wokBalanceConfigSchema>
