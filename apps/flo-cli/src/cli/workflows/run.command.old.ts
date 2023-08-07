import { writeFileSync } from 'fs'
import { indent } from '../../lib/utils'
import { Workflow } from '../../lib/workflows/workflow.schemas'

// This file is left over because we still need to add the NpmStep back into the system

interface NpmStep {
    /** Path to the package.json, relative the current working dir (@TODO: can we make this `repoRoot` somehow?) */
    packageJsonPath?: string
    // incrementVersion?: 'major' | 'minor' | 'patch'
    npmScripts: Record<string, string>
}

const workflowConfig: Workflow[] = [
    {
        name: 'Init prettier',
        workflowId: 'init-prettier',
        steps: [
            { name: 'Install prettier', command: 'npm i -D prettier' },
            { copyFrom: '$configRoot/.prettierrc', to: '.prettierrc' },
            // { npmScripts: { format: 'prettier --write .' } },
            { command: 'npm run format' },
        ],
    },
    {
        name: 'Init typeScript',
        workflowId: 'init-ts',
        steps: [
            { command: 'npm i -D typescript @types/node' },
            { copyFrom: '$configRoot/tsconfig.json', to: 'tsconfig.json' },
            // { npmScripts: { typecheck: 'tsc --noEmit' } },
        ],
    },
]

export const addNpmScripts = (scripts: Record<string, string>) => {
    const packagePath = `${process.cwd()}/package.json`
    let packageJson: any

    try {
        packageJson = require(packagePath)
    } catch {
        console.log('Could not find a package.json file'.red)
        process.exit(1)
    }

    packageJson.scripts = packageJson.scripts || {}

    console.log('Adding npm scripts...'.dim)
    indent(
        Object.entries(scripts)
            .map(([scriptName, script]) => `"${scriptName}": "${script}",`)
            .join('\n'),
    )

    Object.entries(scripts).forEach(([scriptName, script]) => {
        packageJson.scripts[scriptName] = script
    })

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 4))
}
