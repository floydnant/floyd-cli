// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cons<H, T> = T extends readonly any[]
    ? ((h: H, ...t: T) => void) extends (...r: infer R) => void
        ? R
        : never
    : never

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

/** Get a union of tuples containing all possible key paths in `TObj` */
export type PathsTuples<TObj, D extends number = 10> = [D] extends [never]
    ? never
    : TObj extends object
    ? {
          [K in keyof TObj]-?:
              | [K]
              | (PathsTuples<TObj[K], Prev[D]> extends infer P ? (P extends [] ? never : Cons<K, P>) : never)
      }[keyof TObj]
    : []

type Join<K, S extends string, P> = K extends string | number
    ? P extends string | number
        ? `${K}${'' extends P ? '' : S}${P}`
        : never
    : never

/** Similar to `PathsTuples` but keys concatenated with `TSeparator` instead of tuples. */
export type PathsConcatenated<TObj, TSeparator extends string = '.', D extends number = 10> = [D] extends [
    never,
]
    ? never
    : TObj extends object
    ? {
          [K in keyof TObj]-?: K extends string | number
              ? `${K}` | Join<K, TSeparator, PathsConcatenated<TObj[K], TSeparator, Prev[D]>>
              : never
      }[keyof TObj]
    : ''

/** Get a union of all nested keys of `TObj` concatenated with `TSeparator`. (similar to `Paths` but only deep key paths) */
export type LeavesConcatenated<TObj, TSeparator extends string = '.', D extends number = 10> = [D] extends [
    never,
]
    ? never
    : TObj extends object
    ? {
          [K in keyof TObj]-?: Join<K, TSeparator, LeavesConcatenated<TObj[K], TSeparator, Prev[D]>>
      }[keyof TObj]
    : ''
