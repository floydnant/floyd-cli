export const interpolateParams = (url: string, params: Record<string, string | boolean | number>) => {
    return Object.entries(params).reduce((acc, [key, value]) => {
        return acc.replace(`:${key}`, value.toString())
    }, url)
}
