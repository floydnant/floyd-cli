import { execSync } from 'child_process'
import { floCommand } from '../invoke-cli'

// @TODO: e2e tests

describe('CLI tests', () => {
    it('should print a help message', () => {
        const output = execSync(`${floCommand} --help`).toString()

        expect(output).toBeTruthy()
    })
})
