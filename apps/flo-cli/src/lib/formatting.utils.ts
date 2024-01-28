/**
 * Highlights the basename by dimming the rest of the path.
 *
 *
 * @param fileOrDirPath
 * @param colorizer An optional colorizer function to colorize the whole path. (green by default)
 */
export const highlightBasename = (fileOrDirPath: string, colorizer = (str: string) => str.green) => {
    const segments = fileOrDirPath.split('/')
    const basename = segments.pop() || ''
    segments.push('')

    return colorizer(segments.join('/')).dim + colorizer(basename)
}

/**
 * Formats a date appropriate to the current locale.
 * @param date
 * @param alignColumns wether to add spaces to align the columns (where leading zeros would usually be)
 */

export const formatDateTime = (date: Date, alignColumns = true) => {
    const formatted = date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    })

    if (!alignColumns) return formatted

    return formatted
        .replace(/\d?\d,/, match => match.padStart(3))
        .replace(/\d?\d:\d\d/, match => match.padStart(5))
}
