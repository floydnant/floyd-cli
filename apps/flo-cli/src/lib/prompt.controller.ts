import prompts from 'prompts'
import { Logger } from './logger.service'

export type Choice<TValue> = prompts.Choice & { value: TValue }

export class PromptController {
    /** Do not use this constructor directly, use `.init()` instead */
    constructor() {
        // nothing in here yet
    }

    async confirm(message: string) {
        const { confirmed }: { confirmed?: boolean } = await prompts({
            type: 'confirm',
            message,
            name: 'confirmed',
        })

        return confirmed ?? false
    }

    input = async (
        message: string,
        options?: { validate?: (input: string) => string | boolean | Promise<string | boolean> },
    ): Promise<string | null> => {
        const { input }: { input?: string } = await prompts({
            type: 'text',
            message,
            name: 'input',
            validate: options?.validate,
        })

        if (!input?.trim()?.length) return null

        return input.trim()
    }

    async select<T>(options: {
        message: string
        choices: (Choice<T> | false | undefined | null)[]
    }): Promise<T | null> {
        const { selected }: { selected?: T } = await prompts({
            type: 'select',
            name: 'selected',
            message: options.message,
            choices: options.choices.filter(Boolean),
            instructions: false,
        })

        return selected ?? null
    }
    async selectMultiple<T>(options: {
        message: string
        choices: (Choice<T> | false | undefined | null)[]
    }): Promise<T[] | null> {
        const { selected }: { selected?: T[] } = await prompts({
            type: 'multiselect',
            name: 'selected',
            message: options.message,
            choices: options.choices.filter(Boolean),
            instructions: false,
        })

        return selected ?? null
    }

    private static instance: PromptController
    static init(...args: ConstructorParameters<typeof PromptController>) {
        if (this.instance) {
            Logger.warn(`${PromptController.name} already initialized, ignoring...`)
            return this.instance
        }

        this.instance = new PromptController(...args)
        return this.instance
    }
    static getInstance() {
        if (!this.instance) throw new Error(`${PromptController.name} not initialized`)
        return this.instance
    }
}
