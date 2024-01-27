import { z } from 'zod'
import { flattenObject } from './object.utils'
import { RecursivePrimitives } from './type.utils'

export const interpolateParams = (url: string, params: Record<string, string>) => {
    return interpolateVariables(url, params, InterpolationStrategy.Colon).interpolated
}

export enum InterpolationStrategy {
    /** `$variable` */
    DollarSign = 'dollarSign',
    /** `:variable` */
    Colon = 'colon',
    /** `{{ variable }}` */
    HandleBars = 'handleBars',
    /** `{variable}` */
    SingleHandleBars = 'singleHandleBars',
    /** `${{ variable }}` */
    GithubStyle = 'githubStyle',
    /**
     * `${ variable }` - this allows you to actually evaluate javascript expressions inside the braces.
     *
     * Only requirement: there need to be spaces between your code and the braces
     * @example
     * ```txt
     * ${ input.flag1 ? 'yes' : 'no' }
     * ```
     */
    Javascript = 'javascript',
    /** `$(variable)` */
    ShellStyle = 'shellStyle',
}

const interpolationStrategies = {
    [InterpolationStrategy.DollarSign]: /\$(?<identifier>(\w+(\.\w)?)+)/g,
    [InterpolationStrategy.Colon]: /:(?<identifier>(\w+(\.\w)?)+)/g,
    [InterpolationStrategy.HandleBars]: /(?<!\$){{\s*(?<identifier>(\w+(\.\w)?)+)\s*}}/g,
    [InterpolationStrategy.SingleHandleBars]: /(?<!{|\$){\s*(?<identifier>(\w+(\.\w)?)+)\s*}(?!})/g,
    [InterpolationStrategy.GithubStyle]: /\${{\s*(?<identifier>(\w+(\.\w)?)+)\s*}}/g,
    // @TODO: javascript interpolation strategy is not properly working when invoked on the whole config file
    [InterpolationStrategy.Javascript]: /\${\s+(?<jsExpression>([^{]|(?<!\$){(?!{))+)\s+}(?!})/g,
    [InterpolationStrategy.ShellStyle]: /\$\(\s*(?<identifier>(\w+(\.\w)?)+)\s*\)/g,
} satisfies Record<InterpolationStrategy, RegExp>

export type InterpolationContext = RecursivePrimitives
export type InterpolationResult = {
    interpolated: string
    unavailableIdentifiers: Set<string>
    unknownIdentifiers: Set<string>
    interpolatedExpressions: Record<string, string>
}

export const interpolateVariables = (
    contents: string,
    context: InterpolationContext,
    strategy: InterpolationStrategy = InterpolationStrategy.HandleBars,
    previousResult?: InterpolationResult,
): InterpolationResult => {
    const flattendContext = flattenObject(context)

    const unavailableIdentifiers = previousResult?.unavailableIdentifiers ?? new Set<string>()
    const unknownIdentifiers = previousResult?.unknownIdentifiers ?? new Set<string>()
    const interpolatedExpressions = previousResult?.interpolatedExpressions ?? ({} as Record<string, string>)

    const regex = interpolationStrategies[strategy]
    const interpolated = contents.replace(regex, (match, firstCaptureGroup, ...info) => {
        // if there are named capture groups, the last element will be an object of those
        const potentialGroups = info[info.length - 1] as string | undefined | number | Record<string, string>
        const groups =
            typeof potentialGroups == 'object' && potentialGroups !== null ? potentialGroups : undefined

        if (groups && 'jsExpression' in groups) {
            const jsExpression = groups['jsExpression']
            const adhocFnArguments = { ...context, z }
            const adhocFn = new Function(...Object.keys(adhocFnArguments), `return ${jsExpression}`)

            const expressionResult = String(adhocFn(...Object.values(adhocFnArguments)))
            interpolatedExpressions[jsExpression] = expressionResult

            return expressionResult
        }

        // if there are named capture groups, we use them, otherwise we use the first capture group
        const identifier = groups?.['identifier'] ?? groups?.['variable'] ?? firstCaptureGroup
        const value = flattendContext[identifier]
        if (value === null) {
            unavailableIdentifiers.add(identifier)
            return match
        }
        if (value === undefined) {
            unknownIdentifiers.add(identifier)
            return match
        }

        const stringValue = value.toString()
        interpolatedExpressions[identifier] = stringValue

        return stringValue
    })

    return {
        interpolated,
        unavailableIdentifiers: unavailableIdentifiers,
        unknownIdentifiers: unknownIdentifiers,
        interpolatedExpressions,
    }
}

/** Goes over the strategies until there is at least one successfully interpolated variable. */
export const interpolateVariablesWithFirstSuccessfulStrategy = (
    contents: string,
    params: InterpolationContext,
    strategies: InterpolationStrategy[],
) => {
    if (strategies.length == 0) throw new Error('At least one interpolation strategy must be provided')

    let result: InterpolationResult | undefined
    for (const strategy of strategies) {
        result = interpolateVariables(contents, params, strategy, result)

        // if we have at least one successful interpolation, we're done
        if (Object.keys(result.interpolatedExpressions).length > 0) return result
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result!
}

/** Applies all strategies sequentially. */
export const interpolateVariablesWithAllStrategies = (
    contents: string,
    params: InterpolationContext,
    strategies: InterpolationStrategy[],
): InterpolationResult => {
    if (strategies.length == 0) throw new Error('At least one interpolation strategy must be provided')

    let result: InterpolationResult | undefined
    for (const strategy of strategies) {
        result = interpolateVariables(result?.interpolated ?? contents, params, strategy, result)
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return result!
}
