import {
    HarvestService,
    MockHarvestRepo,
    MockPersonioRepo,
    PersonioService,
    TimeTrackingService,
} from '@flo/time-tracking'

let services: {
    harvestService: HarvestService
    personioService: PersonioService
    timeTrackingService: TimeTrackingService
}

export const getTimeTrackingServices = () => {
    if (services) return services

    // @TODO: where do we want to store the config?
    // const config = timeTrackingConfigSchema.parse(env)

    const harvestService = new HarvestService(new MockHarvestRepo())
    // const harvestService = new HarvestService(new HarvestRepo(config))
    const personioService = new PersonioService(new MockPersonioRepo())
    // const personioService = new PersonioService(new PersonioRepo(config))

    const timeTrackingService = new TimeTrackingService(harvestService, personioService)

    services = {
        harvestService,
        personioService,
        timeTrackingService,
    }
    return services
}
