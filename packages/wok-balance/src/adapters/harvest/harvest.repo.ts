import axios from 'axios'
import { DateRange } from '../../common'
import { HarvestConfig } from './harvest.config'
import { TimeEntriesResponse } from './models/time-entry.model'
import { toHarvestDateRange } from './harvest.util'
import { mockTimeEntry } from './mocks/time-entry.mock'

export interface IHarvestRepo {
    // getMe(): Promise<Record<string, unknown>>
    // getTimePerTask(dateRange?: Partial<DateRange>): Promise<Record<string, unknown>>
    getTimeEntries(dateRange?: Partial<DateRange>): Promise<TimeEntriesResponse>
}

export class HarvestRepo implements IHarvestRepo {
    constructor(private config: HarvestConfig) {}

    private axios = axios.create({
        baseURL: this.config.HARVEST_BASE_URL,
        headers: {
            'Harvest-Account-ID': this.config.HARVEST_ACCOUNT_ID,
            Authorization: `Bearer ${this.config.HARVEST_API_TOKEN}`,
        },
    })

    async getMe() {
        const endpoint = '/users/me.json'
        const response = await this.axios.get<Record<string, unknown>>(endpoint)

        return response.data
    }

    async getTimePerTask(dateRange?: Partial<DateRange>) {
        const endpoint = '/reports/time/tasks'
        const response = await this.axios.get<Record<string, unknown>>(endpoint)

        return response.data
    }

    async getTimeEntries(dateRange?: Partial<DateRange>) {
        const endpoint = '/time_entries'
        const harvestDateRange = dateRange ? toHarvestDateRange(dateRange) : {}
        const response = await this.axios.get<TimeEntriesResponse>(endpoint, {
            params: harvestDateRange,
        })

        return response.data
    }
}

export class MockHarvestRepo implements IHarvestRepo {
    async getTimeEntries() {
        return {
            time_entries: new Array(160).fill(mockTimeEntry),
        } as TimeEntriesResponse
    }
}
