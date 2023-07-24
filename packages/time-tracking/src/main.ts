import 'dotenv/config'
import { z } from 'zod'
import { HarvestService, MockHarvestRepo, MockPersonioRepo, PersonioService } from './adapters'
import { TimeTrackingConfig, TimeTrackingService, TimeTrackingConfigSchema } from './core'

const main = async (config: TimeTrackingConfig) => {
    const timeTrackingService = new TimeTrackingService(
        // new HarvestService(new HarvestRepo(config)),
        new HarvestService(new MockHarvestRepo()),
        // new PersonioService(new PersonioRepo(config)),
        new PersonioService(new MockPersonioRepo()),
    )
    const balance = await timeTrackingService.getBalance({ employeeId: '1' }) // @TODO: get the employeeId from personio

    console.log({ balance })
}

try {
    main(TimeTrackingConfigSchema.parse(process.env))
} catch (e) {
    insufficientEnvClause: if (e instanceof z.ZodError) {
        const isEnvValidationError = Object.keys(TimeTrackingConfigSchema.shape).includes(
            e.issues[0]?.path?.toString() ?? '',
        )
        if (!isEnvValidationError) break insufficientEnvClause

        console.error(
            'Missing or invalid env vars:',
            Object.fromEntries(
                e.issues.map(issue => [issue.path[0], (issue as z.ZodInvalidTypeIssue).expected]),
            ),
        )
        process.exit(1)
    }

    throw e
}
