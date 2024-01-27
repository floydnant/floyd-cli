import { fnTestName } from './testing.utils'
import { fuzzyMatch } from './utils'

describe(fnTestName(fuzzyMatch), () => {
    it('should match exact/partial', () => {
        const list = ['terminal', 'vscode', 'more random', 'vim', 'noise', 'visual-studio-code']

        expect(fuzzyMatch(list, 'vim', String)).toEqual(['vim'])
        expect(fuzzyMatch(list, 'term', String)).toEqual(['terminal'])
        expect(fuzzyMatch(list, 'code', String)).toEqual(['vscode', 'visual-studio-code'])
    })

    it('should match fuzzy', () => {
        const list = [
            'OpenAI',
            'more random',
            'open api',
            'noise',
            'open api spec',
            'visual-studio-code',
            'Version Control System',
        ]

        expect(fuzzyMatch(list, 'oai', String)).toEqual(['OpenAI', 'open api', 'open api spec'])
        expect(fuzzyMatch(list, 'oas', String)).toEqual(['open api spec'])
        expect(fuzzyMatch(list, 'vscode', String)).toEqual(['visual-studio-code'])
        expect(fuzzyMatch(list, 'vs', String)).toEqual(['visual-studio-code', 'Version Control System'])
        expect(fuzzyMatch(list, 'vsc', String)).toEqual(['visual-studio-code', 'Version Control System'])
        expect(fuzzyMatch(list, 'vcs', String)).toEqual(['Version Control System'])
    })

    it('should prioritize closer matches', () => {
        const list = [
            'OpenAI',
            'more random',
            'open api',
            'noise',
            'open api spec',
            'Version Control System',
            'visual-studio-code',
            'iterm 2',
            'terminal',
        ]

        expect(fuzzyMatch(list, 'oai', String)).toEqual(['OpenAI', 'open api', 'open api spec'])
        expect(fuzzyMatch(list, 'oi', String)).toEqual(['OpenAI', 'open api', 'open api spec', 'noise'])
        expect(fuzzyMatch(list, 'oas', String)).toEqual(['open api spec'])
        expect(fuzzyMatch(list, 'vscode', String)).toEqual(['visual-studio-code'])
        expect(fuzzyMatch(list, 'vs', String)).toEqual(['visual-studio-code', 'Version Control System'])
        expect(fuzzyMatch(list, 'vsc', String)).toEqual(['visual-studio-code', 'Version Control System'])
        expect(fuzzyMatch(list, 'vcs', String)).toEqual(['Version Control System'])

        // @TODO: This doesn't quite work with capital letters, i.e.
        // when given a list of `['iTerm 2', 'terminal']` and a query of `'term'`
        // it yields `['iTerm 2', 'terminal']` instead of `['terminal', 'iTerm 2']` (the same order as below)
        expect(fuzzyMatch(list, 'term', String)).toEqual(['terminal', 'iterm 2'])
    })

    it('should not be confused by special chars', () => {
        const list = [
            'more random',
            'visual-studio-code',
            'iterm 2',
            '$ome $pecial/, chars \0ve |T',
            'some ^ more [things]',
        ]

        expect(fuzzyMatch(list, '$t', String)).toEqual(['$ome $pecial/, chars \0ve |T'])
        expect(fuzzyMatch(list, '^', String)).toEqual(['some ^ more [things]'])
        expect(fuzzyMatch(list, '[]', String)).toEqual(['some ^ more [things]'])
    })
})
