import {
    InterpolationStrategy,
    interpolateVariables,
    interpolateVariablesWithAllStrategies,
    interpolateVariablesWithFirstSuccessfulStrategy,
} from './interpolation.utils'

describe('interpolation utils', () => {
    describe(`${interpolateVariables.name}()`, () => {
        // simple use cases
        for (const [strategy, template] of Object.entries({
            [InterpolationStrategy.DollarSign]: 'https://$domain/$path',
            [InterpolationStrategy.Colon]: 'https://:domain/:path',
            [InterpolationStrategy.HandleBars]: 'https://{{ domain }}/{{path}}',
            [InterpolationStrategy.SingleHandleBars]: 'https://{domain}/{path}',
            [InterpolationStrategy.GithubStyle]: 'https://${{ domain }}/${{path}}',
            [InterpolationStrategy.Javascript]: 'https://${ domain }/${ path }',
            [InterpolationStrategy.ShellStyle]: 'https://$(domain)/$(path)',
        } satisfies Record<InterpolationStrategy, string>)) {
            it(`can interpolate variables with strategy: ${strategy}`, () => {
                const context = {
                    domain: 'example.com',
                    path: 'path/to/resource',
                }

                const result = interpolateVariables(template, context, strategy as InterpolationStrategy)

                expect(result.interpolated).toEqual('https://example.com/path/to/resource')
            })
        }

        // complex use cases
        for (const [strategy, templates] of Object.entries({
            [InterpolationStrategy.DollarSign]: [
                'https://$input.domain/$input.path',
                'End of $sentence.lastWord.',
            ],
            [InterpolationStrategy.Colon]: [
                'https://:input.domain/:input.path',
                'End of :sentence.lastWord.',
            ],
            [InterpolationStrategy.HandleBars]: [
                'https://{{ input.domain }}/{{input.path}}',
                'End of {{ sentence.lastWord }}.',
            ],
            [InterpolationStrategy.SingleHandleBars]: [
                'https://{ input.domain }/{input.path}',
                'End of {sentence.lastWord}.',
            ],
            [InterpolationStrategy.GithubStyle]: [
                'https://${{ input.domain }}/${{input.path}}',
                'End of ${{ sentence.lastWord }}.',
            ],
            [InterpolationStrategy.Javascript]: [
                'https://${ input.domain }/${ input.path }',
                'End of ${ sentence.lastWord }.',
            ],
            [InterpolationStrategy.ShellStyle]: [
                'https://$( input.domain )/$(input.path)',
                'End of $(sentence.lastWord).',
            ],
        } satisfies Record<InterpolationStrategy, string[]>)) {
            it(`can interpolate dot notation variables with strategy: ${strategy}`, () => {
                const context = {
                    input: {
                        domain: 'example.com',
                        path: 'path/to/resource',
                    },
                    sentence: {
                        lastWord: 'Day',
                    },
                }
                const interpolated = ['https://example.com/path/to/resource', 'End of Day.']

                templates.forEach((template, i) => {
                    const result = interpolateVariables(template, context, strategy as InterpolationStrategy)

                    expect(result.interpolated).toEqual(interpolated[i])
                })
            })
        }

        const negativeCases = [
            {
                strategy: InterpolationStrategy.HandleBars,
                shouldNotMatchOn: InterpolationStrategy.GithubStyle,
                cases: ['https://${{ domain }}/${{ path }}'],
            },
            {
                strategy: InterpolationStrategy.SingleHandleBars,
                shouldNotMatchOn: InterpolationStrategy.HandleBars,
                cases: ['https://{{ domain }}/{{ path }}'],
            },
            {
                strategy: InterpolationStrategy.SingleHandleBars,
                shouldNotMatchOn: InterpolationStrategy.GithubStyle,
                cases: ['https://${{ domain }}/${{ path }}'],
            },
            {
                strategy: InterpolationStrategy.Javascript,
                shouldNotMatchOn: InterpolationStrategy.GithubStyle,
                cases: ['https://${{ domain }}/${{ path }}'],
            },
            {
                strategy: InterpolationStrategy.SingleHandleBars,
                shouldNotMatchOn: InterpolationStrategy.Javascript,
                cases: ['https://${ domain }/${ path }'],
            },
        ] satisfies {
            strategy: InterpolationStrategy
            shouldNotMatchOn: InterpolationStrategy
            cases: string[]
        }[]

        for (const { strategy, shouldNotMatchOn: shouldntMatchOn, cases } of negativeCases) {
            it(`${strategy} strategy should not match on ${shouldntMatchOn}`, () => {
                const context = {
                    domain: 'example.com',
                    path: 'path/to/resource',
                }

                cases.forEach(template => {
                    const result = interpolateVariables(template, context, strategy)

                    expect(result.interpolated).toEqual(template)
                })
            })
        }

        describe(`${InterpolationStrategy.Javascript} strategy can evaluate js expressions`, () => {
            const context = {
                input: {
                    flag1: true,
                    key1: 'inputKey1',
                    key2: 'inputKey2',
                    envValue: 'envValue123',
                },
                someValue: 'XYXYXYXY',
            }

            it('can evaluate ternary expression', () => {
                const template = "${ input.flag1 ? 'yes' : 'no' }"

                const result = interpolateVariables(template, context, InterpolationStrategy.Javascript)

                expect(result.interpolated).toEqual('yes')
            })

            it('can evaluate object index expression', () => {
                for (const [template, expected] of Object.entries({
                    "${ { inputKey1: 'yes', inputKey2: 'no' }[input.key1] || 'maybe' }": 'yes',
                    "${ { inputKey1: 'yes', inputKey2: 'no' }[input.key2] || 'maybe' }": 'no',
                    "${ { inputKey1: 'yes', inputKey2: 'no' }[input.key3] || 'maybe' }": 'maybe',
                })) {
                    const result = interpolateVariables(template, context, InterpolationStrategy.Javascript)

                    expect(result.interpolated).toEqual(expected)
                }
            })

            it('can do regex substitution', () => {
                for (const [template, expected] of Object.entries({
                    "${ someValue.replace(/y/gi, 'O') }": 'XOXOXOXO',
                })) {
                    const result = interpolateVariables(template, context, InterpolationStrategy.Javascript)

                    expect(result.interpolated).toEqual(expected)
                }
            })

            it('can use JSON methods', () => {
                for (const [template, expected] of Object.entries({
                    '${ JSON.parse(\'{ "key": "value123" }\')[\'key\'] }': 'value123',
                    "${ JSON.parse('{ \"key\": \"' + input.envValue + '\"  }')['key'] }":
                        context.input.envValue,

                    "${ JSON.stringify({ key: 'value456' }) }": '{"key":"value456"}',
                    '${ JSON.stringify({ key: input.envValue }) }': `{"key":"${context.input.envValue}"}`,
                })) {
                    const result = interpolateVariables(template, context, InterpolationStrategy.Javascript)

                    expect(result.interpolated).toEqual(expected)
                }
            })

            it('can use zod - success', () => {
                for (const [template, expected] of Object.entries({
                    "${ z.object({ key1: z.string() }).safeParse({ key1: 'yes' }).success }": 'true',
                    '${ z.object({ key1: z.string() }).safeParse({}).success }': 'false',
                })) {
                    const result = interpolateVariables(template, context, InterpolationStrategy.Javascript)

                    expect(result.interpolated).toEqual(expected)
                }
            })
            it('can use zod - errors', () => {
                for (const template of ['${ z.object({ key1: z.string() }).parse({}) }']) {
                    expect(() =>
                        interpolateVariables(template, context, InterpolationStrategy.Javascript),
                    ).toThrow()
                }
            })
        })

        it('should report successfully interpolated variables', () => {
            const result = interpolateVariables('{{ var1 }}', {
                var1: 'value1',
                var2: 'value2',
            })

            expect(result.interpolated).toEqual('value1')
            expect(result.unavailableIdentifiers).toEqual(new Set([]))
            expect(result.unknownIdentifiers).toEqual(new Set([]))
            expect(result.interpolatedExpressions).toEqual({ var1: 'value1' })
        })

        it('should report uninterpolateable variables', () => {
            const result = interpolateVariables(
                `
                {{ unavailableVariable }}
                {{ undefinedVariable }}
                {{ unknownVariable }}
                `,
                {
                    unavailableVariable: null,
                    undefinedVariable: undefined,
                },
            )

            expect(result.interpolated).toEqual(
                `
                {{ unavailableVariable }}
                {{ undefinedVariable }}
                {{ unknownVariable }}
                `,
            )
            expect(result.unavailableIdentifiers).toEqual(new Set(['unavailableVariable']))
            expect(result.unknownIdentifiers).toEqual(new Set(['unknownVariable', 'undefinedVariable']))
            expect(result.interpolatedExpressions).toEqual({})
        })
    })

    describe(`${interpolateVariablesWithFirstSuccessfulStrategy.name}()`, () => {
        const context = {
            domain: 'example.com',
            path: 'path/to/resource',
        }

        it('should interpolate with the first successful strategy', () => {
            const template = 'https://{{ domain }}/{{ path }}'
            const result = interpolateVariablesWithFirstSuccessfulStrategy(template, context, [
                InterpolationStrategy.Colon,
                InterpolationStrategy.GithubStyle,
                InterpolationStrategy.HandleBars,
            ])

            expect(result.interpolated).toEqual('https://example.com/path/to/resource')
        })

        it('should ignore later strategies (after successful interpolation)', () => {
            const template = 'https://{domain}/:path'
            const result = interpolateVariablesWithFirstSuccessfulStrategy(template, context, [
                InterpolationStrategy.GithubStyle,
                InterpolationStrategy.Colon,
                InterpolationStrategy.SingleHandleBars,
            ])

            expect(result.interpolated).toEqual('https://{domain}/path/to/resource')
        })
    })

    describe(`${interpolateVariablesWithAllStrategies.name}()`, () => {
        const context = {
            domain: 'example.com',
            path: 'path/to/resource',
            userId: '123',
        }

        it('should aplly all strategies', () => {
            const template = 'https://{{ domain }}/{path}/:userId'
            const result = interpolateVariablesWithAllStrategies(template, context, [
                InterpolationStrategy.Colon,
                InterpolationStrategy.GithubStyle,
                InterpolationStrategy.SingleHandleBars,
                InterpolationStrategy.HandleBars,
            ])

            expect(result.interpolated).toEqual('https://example.com/path/to/resource/123')
        })
    })
})
