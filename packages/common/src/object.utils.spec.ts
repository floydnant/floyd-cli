import { flattenObject } from './object.utils'

describe('object utils', () => {
    describe(`${flattenObject}()`, () => {
        it('can flatten an object', () => {
            const fn = () => ''
            const result = flattenObject({
                a: 'a',
                b: null,
                c: undefined,
                d: {
                    a: 'a',
                    b: null,
                    c: {
                        isNestedStuff: true,
                        fn,
                    },
                    d: 123,
                },
            })

            expect(result).toEqual({
                a: 'a',
                b: null,
                c: undefined,
                'd.a': 'a',
                'd.b': null,
                'd.c.isNestedStuff': true,
                'd.c.fn': fn,
                'd.d': 123,
            })
        })
    })
})
