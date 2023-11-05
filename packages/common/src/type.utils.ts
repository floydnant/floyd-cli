import { Primitive } from 'zod'

export type Nullable<T extends object> = { [P in keyof T]?: T[P] | null }

export type UnwrapArray<T> = T extends (infer U)[] ? U : never

export type MaskOf<T> = Partial<{
    [K in keyof T]: boolean
}>

export interface RecursivePrimitives {
    [key: string]: Primitive | RecursivePrimitives
}
// eslint-disable-next-line @typescript-eslint/ban-types
export interface RecursiveObj<TValue = Primitive | Function> {
    [key: string]: TValue | RecursiveObj<TValue>
}
