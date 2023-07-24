import { Command } from 'commander'
import { copyFileSync, writeFileSync } from 'fs'
import prompts from 'prompts'
import { ConfigFile, getConfigFilePath } from '../../lib/config'
import { exec, indent } from '../../lib/utils'

export interface Workflow {
    name: string
    description?: string
    aliases?: string[]
    steps: WorkflowStep[]
}

const workflowConfig: Workflow[] = [
    {
        name: 'Prettier',
        steps: [
            { title: 'Install prettier', command: 'npm i -D prettier' },
            { files: ['.prettierrc'] },
            { npmScripts: { format: 'prettier --write .' } },
            { command: 'npx prettier --write .' },
        ],
    },
    {
        name: 'TypeScript',
        aliases: ['ts'],
        steps: [
            { command: 'npm i -D typescript @types/node' },
            { files: ['tsconfig.json'] },
            { npmScripts: { typecheck: 'tsc --noEmit' } },
        ],
    },
]

type WorkflowStep = { title?: string } & (CommandStep | FilesStep | NpmScriptsStep)
interface CommandStep {
    command: string
}
// @TODO: this should be way more generic than this
interface FilesStep {
    files: ConfigFile[]
}
interface FileStep {
    /** The file to create i.e. '.prettierrc' or 'src/index.js' */
    filePath: string
    /** The file to copy the contents from, can be a simple name, if the file has been registered in the config */
    contentsFile?: string
    /** same as `contentsFile` but inline */
    contents?: string
}

interface NpmScriptsStep {
    npmScripts: Record<string, string>
}
const isCommandStep = (step: WorkflowStep): step is CommandStep => 'command' in step
const isFilesStep = (step: WorkflowStep): step is FilesStep => 'files' in step || 'filePath' in step
const isNpmScriptsStep = (step: WorkflowStep): step is NpmScriptsStep => 'npmScripts' in step

const workingDir = process.cwd()

export const addNpmScripts = (scripts: Record<string, string>) => {
    const packagePath = `${workingDir}/package.json`
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

const initFile = (configFile: ConfigFile) => {
    console.log(`\nCreating file '${configFile}'...`.dim)
    copyFileSync(getConfigFilePath(configFile), `${workingDir}/${configFile}`)
}

const transformTitle = (step: WorkflowStep) => {
    const getStep = (title: string): WorkflowStep & { title: string } => ({ ...step, title })

    if (step.title && !isCommandStep(step)) return getStep(step.title)

    if (isCommandStep(step)) {
        const defaultTitle = `Run \`${step.command}\``
        const title = step.title ? `${step.title} (${defaultTitle})` : defaultTitle
        return getStep(title)
    }

    if (isFilesStep(step)) return getStep(`Create file '${step.files}'`)

    if (isNpmScriptsStep(step)) {
        const scripts = Object.entries(step.npmScripts).map(
            ([scriptName, script]) => `${scriptName}: "${script}"`.yellow,
        )
        return getStep(`Add ${scripts.length} npm scripts: ${scripts.join(', ')}`)
    }

    return getStep('Unknown step')
}

const createWorkflowHandler = (workflow: Workflow) => {
    return async (opts: { yes?: boolean }) => {
        console.log('Running'.dim, workflow.name.blue, 'workflow...\n'.dim)

        let steps = workflow.steps.map(transformTitle)
        if (!opts.yes) {
            const { selectedSteps }: { selectedSteps?: typeof steps } = await prompts({
                name: 'selectedSteps',
                type: 'autocompleteMultiselect',
                message: 'Select steps to run',
                choices: steps.map<prompts.Choice>(step => ({
                    title: step.title,
                    value: step,
                    selected: true,
                })),
            })
            if (!selectedSteps) return
            steps = selectedSteps
        }

        for (const step of steps) {
            console.log(step.title, '...'.dim)

            if (isCommandStep(step)) exec(step.command)
            if (isFilesStep(step)) step.files.forEach(file => initFile(file))
            if (isNpmScriptsStep(step)) addNpmScripts(step.npmScripts)
        }
    }
}

export const runCommand = new Command().createCommand('run').description('Run predefined workflows')

workflowConfig.forEach(workflow =>
    runCommand
        .command(workflow.name.toLowerCase())
        .aliases(workflow.aliases || [])
        .option('-y, --yes', 'Run all steps without confirmation')
        .action(createWorkflowHandler(workflow)),
)
