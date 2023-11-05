import { Primitive } from 'zod'
import { LeavesConcatenated } from './traversing.type-utils'
import { RecursiveObj } from './type.utils'

/**
 * Flattens an object to a single level object with concatenated keys.
 * @param obj
 * @param prefix used for concatenation, don't used directly as it wont be reflected in the return type
 * @return flattend object - I know its only a Record and the types aren't porperly mapped, but I don't care enough to fix it.
 */
export const flattenObject = <
    TObj extends RecursiveObj,
    // eslint-disable-next-line @typescript-eslint/ban-types
    TValue extends Primitive | Function,
>(
    obj: TObj,
    /** @internal used for concatenation, don't used directly as it wont be reflected in the return type */
    prefix?: string,
): Record<LeavesConcatenated<TObj>, TValue> => {
    const flattend = Object.entries(obj).reduce(
        (acc, [key, value]) => {
            const prefix_ = prefix ? prefix + '.' : ''
            if (typeof value != 'object' || value === null) {
                acc[prefix_ + key] = value as TValue
                return acc
            }

            // Look, I'm not proud of it, but `any` is actually the only solution here.
            // Try removing it, you'll get a `Type instantiation is excessively deep and possibly infinite.ts(2589)`.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...acc, ...(flattenObject(value, prefix_ + key) as any) }
        },
        {} as Record<string, TValue>,
    )

    return flattend
}
