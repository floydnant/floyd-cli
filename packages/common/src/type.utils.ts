export type Nullable<T extends object> = { [P in keyof T]?: T[P] | null }

export type UnwrapArray<T> = T extends (infer U)[] ? U : never
