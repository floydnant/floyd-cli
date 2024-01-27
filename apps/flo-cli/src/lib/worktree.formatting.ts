import os from 'os'
import path from 'path'
import { Worktree } from '../adapters/git/git.model'
import { getPaddedStr, getRelativePathOf, indent } from './utils'
import { LastModifiedStats } from './worktrees/worktree.service'
import { formatDateTime, highlightBasename } from './formatting.utils'

export const getWorktreeAttributesString = (worktree: Worktree, isDirty: boolean) => {
    const checkedOut = worktree.isBare
        ? '[bare]'.yellow
        : worktree.isDetached
        ? worktree.head?.yellow
        : worktree.branch?.yellow

    const info = [
        worktree.isDetached ? 'detached'.grey : null,
        worktree.isCurrent ? 'current'.green : null,
        isDirty ? 'dirty'.red : null,
        worktree.isLocked ? 'locked'.cyan : null,
        worktree.isPrunable ? 'prunable'.cyan : null,
        worktree.isMainWorktree ? 'main'.blue : '',
    ]
        .filter(Boolean)
        .join(', ')

    return [checkedOut, info ? `(${info})` : ''].filter(Boolean).join(' ')
}

const modifiedLabel: Record<LastModifiedStats['type'], string> = {
    head: 'last commit: '.dim,
    dirtyFiles: 'last touched: '.dim,
    folder: 'last touched: '.dim,
}
const longestModifiedLabel = Math.max(...Object.values(modifiedLabel).map(label => label.stripColors.length))

const getDateString = (modifiedStats: LastModifiedStats) => {
    const label = modifiedLabel[modifiedStats.type]
    return {
        label,
        labelLength: label.stripColors.length,
        dateString: formatDateTime(modifiedStats.latest),
    }
}
const appendDateString = (
    prevString: string,
    maxLength: number,
    modifiedStats: LastModifiedStats,
    useEmptySpacers = false,
) => {
    const result = getDateString(modifiedStats)
    const lastModifiedString = result.label + result.dateString
    const extraLabelIntentation = longestModifiedLabel - result.labelLength

    return (
        getPaddedStr(prevString, useEmptySpacers ? ' ' : undefined, maxLength + extraLabelIntentation) +
        ' '.dim +
        lastModifiedString
    )
}

const appendDirectory = (
    prevString: string,
    maxLength: number,
    directory: string,
    useEmptySpacers = false,
) => {
    const relativeDir = getRelativePathOf(directory, os.homedir())
    return (
        getPaddedStr(prevString, useEmptySpacers ? ' ' : undefined, maxLength) +
        ' '.dim +
        highlightBasename(relativeDir)
    )
}

export const getWorktreeHeaders = (
    worktrees: (Worktree & { isDirty: boolean; modifiedStats?: LastModifiedStats })[],
    useEmptySpacers = false,
) => {
    const worktreeAttrs = worktrees.map(worktree => ({
        worktree,
        attrsString: getWorktreeAttributesString(worktree, worktree.isDirty),
    }))
    const longestAttrsString = Math.max(
        ...worktreeAttrs.map(({ attrsString }) => attrsString.stripColors.length),
    )

    const worktreesAttrsWithLastModified = worktreeAttrs.map(({ worktree, attrsString }) => ({
        worktree,
        attrsWithLastModifiedString: worktree.modifiedStats
            ? appendDateString(attrsString, longestAttrsString, worktree.modifiedStats, useEmptySpacers)
            : attrsString,
    }))
    const longestAttrsWithLastModifiedString = Math.max(
        ...worktreesAttrsWithLastModified.map(
            ({ attrsWithLastModifiedString }) => attrsWithLastModifiedString.stripColors.length,
        ),
    )

    const worktreeHeaders = worktreesAttrsWithLastModified.map(
        ({ worktree, attrsWithLastModifiedString }) => ({
            worktree,
            header: appendDirectory(
                attrsWithLastModifiedString,
                longestAttrsWithLastModifiedString,
                worktree.directory,
                useEmptySpacers,
            ),
        }),
    )

    return worktreeHeaders
}

export const highlightGitStatusLine = (line: string) => {
    return (
        // The second letter needs to be replaced first, otherwise the first
        // letter can't be matched properly because of the color codes
        line
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .replace(/^.M/, match => match[0] + match[1]!.blue)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .replace(/^.D/, match => match[0] + match[1]!.red)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .replace(/^(M|R)./, match => match[0]!.yellow + match[1])
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .replace(/^D./, match => match[0]!.red + match[1])
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .replace(/^A./, match => match[0]!.green + match[1])
            .replace(/^\?\?/, '??'.green)
    )
}
export const formatGitStatus = (
    gitStatus: string,
    directory: string,
    maxLength: number,
    modifiedStats: LastModifiedStats,
) => {
    const fileEntries = modifiedStats.files || []

    const isDirty = !!gitStatus
    const gitStatusWithDate = !isDirty
        ? ' clean'.dim
        : gitStatus
              .split('\n')
              .map(line => {
                  const filePath = line.replace(/^.{2}/, '').trim() // Remove leading file info

                  const [, lastModifiedAt] =
                      fileEntries.find(([absoluteFilePath]) => {
                          const relativeFilePath = path.relative(directory, absoluteFilePath)
                          return filePath == relativeFilePath
                      }) || []

                  const highlightedLine = line.replace(
                      filePath,
                      highlightBasename(filePath, str => str),
                  )

                  return {
                      string: lastModifiedAt
                          ? `${getPaddedStr(highlightedLine, '─', maxLength)} ${
                                formatDateTime(lastModifiedAt).dim
                            }`
                          : highlightedLine,
                      date: lastModifiedAt,
                  }
              })
              .sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0))
              .map(({ string }) => string)
              .map(highlightGitStatusLine)
              .join('\n')

    return gitStatusWithDate
}

export const getWorktreeSections = (
    worktrees: (Worktree & {
        isDirty: boolean
        modifiedStats: LastModifiedStats
        gitStatus: string
        commitLog?: string
    })[],
) => {
    const worktreeStats = worktrees.map(worktree => ({
        worktree,
        statsString: getWorktreeAttributesString(worktree, worktree.isDirty),
    }))
    const longestAtrributeString = Math.max(
        ...worktreeStats.map(({ statsString }) => statsString.stripColors.length),
    )
    const longestGitStatusLine = Math.max(
        ...worktrees.flatMap(({ gitStatus }) => gitStatus.split('\n').map(l => l.length)),
    )

    const gitStatusIndentation = 3

    const worktreeAttrsWithDateString = worktreeStats.map(({ worktree, statsString }) => {
        const result = getDateString(worktree.modifiedStats)
        const lastModifiedString = result.label + result.dateString

        const extraLabelIntentation = longestModifiedLabel - result.labelLength

        const alignedColumn = Math.max(
            longestAtrributeString + longestModifiedLabel,
            longestGitStatusLine + gitStatusIndentation,
        )

        const maxLength = alignedColumn - longestModifiedLabel
        const headerMaxLength = maxLength + extraLabelIntentation
        const bodyMaxLength = maxLength + result.labelLength - gitStatusIndentation

        return {
            worktree,
            header: getPaddedStr(statsString, undefined, headerMaxLength) + ' ' + lastModifiedString,
            formattedGitStatus: formatGitStatus(
                worktree.gitStatus,
                worktree.directory,
                bodyMaxLength,
                worktree.modifiedStats,
            ),
        }
    })
    const longestStatsWithLastTouchedString = Math.max(
        ...worktreeAttrsWithDateString.map(({ header }) => header.stripColors.length),
    )

    const worktreeSections = worktreeAttrsWithDateString.map(({ worktree, header, formattedGitStatus }) => {
        const combined = [
            appendDirectory(header, longestStatsWithLastTouchedString, worktree.directory),
            indent(formattedGitStatus, gitStatusIndentation),
            worktree.commitLog && indent('\n' + worktree.commitLog.trim(), 4),
        ]
            .filter(Boolean)
            .join('\n')

        return {
            worktree: worktree,
            section: '\n' + combined + '\n',
        }
    })

    return worktreeSections
}
