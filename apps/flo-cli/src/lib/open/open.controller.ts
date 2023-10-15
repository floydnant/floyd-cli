import '@total-typescript/ts-reset'
import prompts from 'prompts'
import { Logger } from '../logger.service'
import { OpenService } from './open.service'
import { OpenPort } from './open.types'

export class OpenController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor(private openService: OpenService) {}

    private async selectPortAndOpen(options: {
        url: string
        reuseWindow?: boolean
        message?: string
        subject: string
        noopTitle?: string | false
        portsPredicate: (port: OpenPort) => boolean
    }) {
        const openPorts = this.openService.useAllInstalled(
            openPort =>
                options.portsPredicate(openPort) &&
                (options?.reuseWindow ? openPort.isReuseWindowSupported : true),
        )
        if (openPorts.length == 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            openPorts[0]!.open(options.url, options)
            return
        }

        const { openInSelected }: { openInSelected?: () => void } = await prompts({
            type: 'select',
            name: 'openInSelected',
            message: options.message || `How would you like to open ${options.url.green}?`,
            choices: [
                ...openPorts.flatMap(openPort => {
                    return [
                        openPort.isReuseWindowSupported && {
                            title: `Open ${options.subject} in ${openPort.name} (reuse window)`,
                            value: () => openPort.open(options.url, { reuseWindow: true }),
                        },
                        {
                            title: `Open ${options.subject} in ${openPort.name}`,
                            value: () => openPort.open(options.url),
                        },
                    ]
                }),
                options.noopTitle !== false && {
                    title: options.noopTitle ?? 'Nevermind',
                    value: () => undefined,
                    description: 'suit yourself then',
                },
            ].filter(Boolean),
            instructions: false,
        })

        openInSelected?.()
    }

    async openFile(
        directory: string,
        options?: { reuseWindow?: boolean; message?: string; subject?: string; noopTitle?: string },
    ) {
        return await this.selectPortAndOpen({
            url: directory,
            reuseWindow: options?.reuseWindow,
            message: options?.message,
            subject: options?.subject || 'file',
            noopTitle: options?.noopTitle,
            portsPredicate: port => port.isFilesSupported,
        })
    }

    async openFolder(
        directory: string,
        options?: { reuseWindow?: boolean; message?: string; subject?: string; noopTitle?: string },
    ) {
        return await this.selectPortAndOpen({
            url: directory,
            reuseWindow: options?.reuseWindow,
            message: options?.message,
            subject: options?.subject || 'folder',
            noopTitle: options?.noopTitle,
            portsPredicate: port => port.isFoldersSupported,
        })
    }

    async openUrl(url: string, options?: { message?: string; subject?: string; noopTitle?: string }) {
        return await this.selectPortAndOpen({
            url,
            message: options?.message,
            subject: options?.subject || 'url',
            noopTitle: options?.noopTitle,
            portsPredicate: port => port.isUrlsSupported,
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
