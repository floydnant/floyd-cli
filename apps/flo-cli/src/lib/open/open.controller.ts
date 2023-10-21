import '@total-typescript/ts-reset'
import os from 'os'
import prompts from 'prompts'
import { Logger } from '../logger.service'
import { getRelativePathOf } from '../utils'
import { OpenService } from './open.service'
import { OpenPort, OpenType } from './open.types'

const portPredicateMap: Record<OpenType, (port: OpenPort) => boolean> = {
    file: port => port.isFilesSupported,
    folder: port => port.isFoldersSupported,
    url: port => port.isUrlsSupported,
}

export class OpenController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private openService: OpenService) {}

    private async selectPortAndOpen(options: {
        url: string
        reuseWindow?: boolean
        message?: string
        type: OpenType
        subject?: string
        noopTitle?: string | false
    }) {
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

        const noopTitle = options.noopTitle || 'Nevermind'
        const noopCallback = () => Logger.log(noopTitle)
        const { openInSelected }: { openInSelected?: () => void } = await prompts({
            type: 'select',
            name: 'openInSelected',
            message: options.message || `How would you like to open ${options.url.green}?`,
            choices: [
                ...openPorts.flatMap(openPort => [
                    openPort.isReuseWindowSupported &&
                        options.type == OpenType.Folder && {
                            title: `Open ${options.subject} in ${openPort.name} (reuse window)`,
                            value: () => openPort.open(options.url, { reuseWindow: true }),
                        },
                    {
                        title: `Open ${options.subject} in ${openPort.name}`,
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

    async openFile(file: string, options?: { message?: string; subject?: string; noopTitle?: string }) {
        return await this.selectPortAndOpen({
            url: getRelativePathOf(file, os.homedir()),
            type: OpenType.File,
            message: options?.message,
            subject: options?.subject,
            noopTitle: options?.noopTitle,
        })
    }

    async openFolder(
        directory: string,
        options?: { reuseWindow?: boolean; message?: string; subject?: string; noopTitle?: string },
    ) {
        return await this.selectPortAndOpen({
            url: getRelativePathOf(directory, os.homedir()),
            type: OpenType.Folder,
            reuseWindow: options?.reuseWindow,
            message: options?.message,
            subject: options?.subject,
            noopTitle: options?.noopTitle,
        })
    }

    async openUrl(url: string, options?: { message?: string; subject?: string; noopTitle?: string }) {
        return await this.selectPortAndOpen({
            url,
            type: OpenType.Url,
            message: options?.message,
            subject: options?.subject,
            noopTitle: options?.noopTitle,
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
