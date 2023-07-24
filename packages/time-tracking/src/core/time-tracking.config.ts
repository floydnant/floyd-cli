import { z } from 'zod'
import { harvestConfigSchema, personioConfigSchema } from '../adapters'

export const TimeTrackingConfigSchema = z.object({
    ...harvestConfigSchema.shape,
    ...personioConfigSchema.shape,
})
export type TimeTrackingConfig = z.infer<typeof TimeTrackingConfigSchema>
