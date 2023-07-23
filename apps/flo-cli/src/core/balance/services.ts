import {
    HarvestService,
    MockHarvestRepo,
    MockPersonioRepo,
    PersonioService,
    WokBalanceService,
    wokBalanceConfigSchema,
} from '@flo/wok-balance'

let services: {
    harvestService: HarvestService
    personioService: PersonioService
    wokBalanceService: WokBalanceService
}

export const getWokBalanceServices = () => {
    if (services) return services

    // @TODO: where do we want to store the config?
    const config = wokBalanceConfigSchema.safeParse(process.env)

    const harvestService = new HarvestService(new MockHarvestRepo())
    // const harvestService = new HarvestService(new HarvestRepo(config))
    const personioService = new PersonioService(new MockPersonioRepo())
    // const personioService = new PersonioService(new PersonioRepo(config))

    const wokBalanceService = new WokBalanceService(harvestService, personioService)

    services = {
        harvestService,
        personioService,
        wokBalanceService,
    }
    return services
}
