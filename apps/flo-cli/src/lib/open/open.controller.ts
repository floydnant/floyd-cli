import '@total-typescript/ts-reset'
import os from 'os'
import { Choice } from 'prompts'
import { AppOptionArg, ReuseWindowOptionArg, WaitForCloseOptionArg } from '../../cli/shared.options'
import { ConfigService } from '../config/config.service'
import { Logger } from '../logger.service'
import { PromptController } from '../prompt.controller'
import { fuzzyMatch, getRelativePathOf } from '../utils'
import { OpenService } from './open.service'
import { OpenPort, OpenType } from './open.types'

export type OpenOptions = {
    message?: string
    subject?: string
    /** Title of the option which doesn't do anything. @default 'Nevermind' */
    noopTitle?: string | false
} & Partial<ReuseWindowOptionArg & AppOptionArg & WaitForCloseOptionArg>

const getOpenChoices = (
    openPort: OpenPort,
    options: { url: string; type: OpenType } & OpenOptions,
    subject: string,
): (Choice & { value: () => boolean })[] => {
    const reuseInstanceChoice = openPort.canReuseWindow &&
        !openPort.alwaysReusesWindow &&
        openPort.reuseWindowSupportedTypes.includes(options.type) && {
            title: `Open ${subject} in ${openPort.name} (reuse window)`,
            value: () => openPort.open(options.url, { reuseWindow: true }),
        }

    const waitForCloseChoice = openPort.canWaitForClose &&
        !openPort.alwaysWaitsForClose &&
        openPort.waitForCloseSupportedTypes.includes(options.type) && {
            title: `Open ${subject} in ${openPort.name} (wait for close)`,
            value: () => openPort.open(options.url, { waitForClose: true }),
        }

    const choices = [
        !options.waitForClose && reuseInstanceChoice,
        !options.reuseWindow && waitForCloseChoice,

        (!options.reuseWindow || openPort.alwaysReusesWindow) &&
            (!options.waitForClose || openPort.alwaysWaitsForClose) && {
                title: `Open ${subject} in ${openPort.name}`,
                value: () => openPort.open(options.url),
            },
    ]

    return choices.filter(Boolean)
}

const isFeasibleForWait = (port: OpenPort, options: { type: OpenType } & OpenOptions) => {
    if (!port.canWaitForClose) return false
    if (!port.waitForCloseSupportedTypes.includes(options.type)) return false

    return true
}
const isFeasibleForReuse = (port: OpenPort, options: { type: OpenType } & OpenOptions) => {
    if (!port.canReuseWindow) return false
    if (!port.reuseWindowSupportedTypes.includes(options.type)) return false

    return true
}
const isFeasible = (options: { type: OpenType } & OpenOptions) => (port: OpenPort) => {
    if (!port.supportedTypes.includes(options.type)) return false

    if (options.reuseWindow && !isFeasibleForReuse(port, options)) return false
    if (options.waitForClose && !isFeasibleForWait(port, options)) return false

    return true
}

export class OpenController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private openService: OpenService,
        private configService: ConfigService,
        private promptController: PromptController,
    ) {}

    private async selectPortAndOpen(options: { url: string; type: OpenType } & OpenOptions) {
        const useDefaultApp = !options.app
        const app = typeof options.app == 'string' ? options.app : undefined

        const feasibleOpenPorts = this.openService.useAllInstalled(isFeasible(options))
        if (feasibleOpenPorts.length == 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            feasibleOpenPorts[0]!.open(options.url, options)
            return
        }

        directMatchScope: if (useDefaultApp || app) {
            const configuredAppName = app || this.configService.config.openIn?.defaults?.[options.type]
            if (!configuredAppName) break directMatchScope

            const matchedOpenPorts = fuzzyMatch(
                feasibleOpenPorts,
                configuredAppName,
                openPort => openPort.name,
            )
            const firstMatch = matchedOpenPorts[0]
            if (!firstMatch) break directMatchScope

            const success = firstMatch.open(options.url, {
                reuseWindow: options.reuseWindow,
                waitForClose: options.waitForClose,
            })
            if (success) return
        }

        const noopTitle = options.noopTitle || 'Nevermind'
        const noopCallback = () => (Logger.log(noopTitle), true)

        const subject = options.subject || options.type

        const openInSelected = await this.promptController.select<() => boolean>({
            message: options.message || `How would you like to open ${options.url.green}?`,
            choices: [
                ...feasibleOpenPorts.flatMap(openPort => getOpenChoices(openPort, options, subject)),
                options.noopTitle !== false && {
                    title: noopTitle,
                    value: noopCallback,
                    description: 'suit yourself then',
                },
            ].filter(Boolean),
        })
        const callback = openInSelected || noopCallback
        callback()
    }

    async openFile(file: string, options?: Omit<OpenOptions, 'reuseWindow'>) {
        return await this.selectPortAndOpen({
            url: getRelativePathOf(file, os.homedir()),
            type: OpenType.File,
            ...options,
        })
    }

    async openFolder(directory: string, options?: OpenOptions) {
        return await this.selectPortAndOpen({
            url: getRelativePathOf(directory, os.homedir()),
            type: OpenType.Folder,
            ...options,
        })
    }

    async openUrl(url: string, options?: Omit<OpenOptions, 'reuseWindow' | 'waitForClose'>) {
        return await this.selectPortAndOpen({
            url,
            type: OpenType.Url,
            ...options,
        })
    }

    private static instance: OpenController
    static init(...args: ConstructorParameters<typeof OpenController>) {
        if (this.instance) {
            Logger.warn(`${OpenController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new OpenController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${OpenController.name} not initialized`)
        return this.instance
    }
}
