// eslint-disable-next-line @typescript-eslint/ban-types
export const fnTestName = (func: Function) => {
    if (!func.name) {
        throw new Error(`Could not get function name of ${func.toString()}`)
    }

    return `${func.name}()`
}
