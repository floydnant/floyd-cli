import '@total-typescript/ts-reset'
import os from 'os'
import prompts from 'prompts'
import { Logger } from '../logger.service'
import { getRelativePathOf } from '../utils'
import { OpenService } from './open.service'
import { OpenPort, OpenType } from './open.types'
import { ConfigService } from '../config/config.service'
import { AppOptionArg, ReuseWindowOptionArg } from '../../cli/shared.options'

const portPredicateMap: Record<OpenType, (port: OpenPort) => boolean> = {
    file: port => port.isFilesSupported,
    folder: port => port.isFoldersSupported,
    url: port => port.isUrlsSupported,
}

export type OpenOptions = {
    message?: string
    subject?: string
    /** Title of the option which doesn't do anything. @default 'Nevermind' */
    noopTitle?: string | false
} & Partial<ReuseWindowOptionArg & AppOptionArg>

export class OpenController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(
        private openService: OpenService,
        private configService: ConfigService,
    ) {}

    private async selectPortAndOpen(options: { url: string; type: OpenType } & OpenOptions) {
        const useDefaultApp = !options.app
        const app = typeof options.app == 'string' ? options.app : undefined

        const openPorts = this.openService.useAllInstalled(
            openPort =>
                portPredicateMap[options.type](openPort) &&
                (options?.reuseWindow ? openPort.isReuseWindowSupported : true),
        )
        if (openPorts.length == 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            openPorts[0]!.open(options.url, options)
            return
        }

        if ((useDefaultApp ?? true) || app) {
            const configuredAppName = app || this.configService.config.openIn?.defaults?.[options.type]
            const regex = new RegExp('^' + configuredAppName?.split(' ').join('.+'), 'i')
            const openPort = configuredAppName
                ? openPorts.find(openPort => regex.test(openPort.name))
                : undefined
            if (openPort?.isInstalled()) {
                const success = openPort.open(options.url, { reuseWindow: options.reuseWindow })
                if (success) return
            }
        }

        const noopTitle = options.noopTitle || 'Nevermind'

        const noopCallback = () => Logger.log(noopTitle)
        const subject = options.subject || options.type
        const { openInSelected }: { openInSelected?: () => void } = await prompts({
            type: 'select',
            name: 'openInSelected',
            message: options.message || `How would you like to open ${options.url.green}?`,
            choices: [
                ...openPorts.flatMap(openPort => [
                    openPort.isReuseWindowSupported &&
                        options.type == OpenType.Folder && {
                            title: `Open ${subject} in ${openPort.name} (reuse window)`,
                            value: () => openPort.open(options.url, { reuseWindow: true }),
                        },
                    {
                        title: `Open ${subject} in ${openPort.name}`,
                        value: () => openPort.open(options.url),
                    },
                ]),
                options.noopTitle !== false && {
                    title: noopTitle,
                    value: noopCallback,
                    description: 'suit yourself then',
                },
            ].filter(Boolean),
            instructions: false,
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

    async openUrl(url: string, options?: Omit<OpenOptions, 'reuseWindow'>) {
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
