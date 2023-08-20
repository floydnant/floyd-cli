# Floyd CLI

A cli for automating and simplifying common tasks such as

-   [Managing git worktrees](#worktrees) (creating, displaying, switching, deleting, etc.)
-   Managing pr checks (displaying, rerunning, etc.)
-   Running common tasks as [automated workflows](#workflows)
-   [More to come...](#todo)

## Table of contents

- [Floyd CLI](#floyd-cli)
  - [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Updates](#updates)
- [Usage](#usage)
- [Worktrees](#worktrees)
  - [Hooks](#hooks)
- [Configuration](#configuration)
  - [Global configuration](#global-configuration)
  - [Project configuration](#project-configuration)
  - [Local configuration](#local-configuration)
- [Workflows](#workflows)
  - [Workflow Usage](#workflow-usage)
  - [Workflow Definition Reference](#workflow-definition-reference)
  - [Step Definition Reference](#step-definition-reference)
    - [Variables](#variables)
    - [Copy File Step](#copy-file-step)
    - [Command Step](#command-step)
    - [Workflow Step](#workflow-step)
    - [NPM Step - Coming soon!](#npm-step---coming-soon)
- [TODO](#todo)
  - [Docs](#docs)
  - [Features](#features)
  - [Internal](#internal)
  - [Rough ideas](#rough-ideas)

# Installation

There will be an install script or npm installation at some point, but for now:

```bash
# Clone the repo
git clone git@github.com:floydnant/floyd-cli.git
cd floyd-cli

# Install dependencies
npm i

# Build the CLI
npm run build

# Make the CLI globally available - may require the good ol' `sudo`
npm i . -g
```

> If you make any changes to the source code, just run the npm `build` or `dev` scripts respectively and the updates will be reflected in the bin installation.
>
> Also if you'd like a different command than `flo`, you can modify the `bin` in the `package.json` to sth nicer, followed by another `npm i . -g`. Though, revert your changes again (`git reset --hard`) to reenable updates because `git pull` doesn't like dirty working trees.

# Updates

<!-- @TODO: @floydnant The user can easily break this by just removing the workflow from the config. -->

Run the `update` workflow to pull the latest changes and rebuild the CLI.

```bash
flo run update
```

# Usage

Arguments displayed as `[argument]` are optional, the ones displayed as `<argument>` are required.

```bash
# for available commands
flo help

# for help on a command
flo help <command> # or flo <command> --help
```

Disclaimer: All commands that are available, but not documented here are WIP.

# Worktrees

There are times in life, where one worktree simply isn't enough.

A quick hot fix or a local pr review disturbs the feature you're working on
and you don't want to stash your changes, checkout main, checkout a fresh branch,
do the stuff and then checkout the original branch again, pop the stash, start dev servers and continue with business as usual?

Well, no more! Here come worktrees! (The git cli for worktrees is kinda awkward to work with on a day to day basis, so we've made them smoother).

You can create worktrees from new or existing branches and pull requests, switch vscode window to another worktree, list worktrees with useful information and more.

Use these aliases for a quicker typing experience:

```bash
flo worktrees|wok|tr <subcomand>
```

You can pass a branch name to the commands for quicker usage or leave it blank for an interactive prompt.
Refer to the `--help` pages for possible options and arguments.

@TODO: @floydnant implement option to directly open/switch to the new worktree and skip the prompt

```bash
# Create a fresh worktree from a branch
flo tr create|c [new or existing branch]

# Create a fresh worktree from a pull request
flo tr create|c --pr [number or branch]

# List worktrees for current repo
flo tr list|ls
flo tr # Also works as a shorthand

# Delete worktrees for current repo
flo tr delete|d [branch]

# Switch vs code window to another worktree
flo tr switch|sw [branch]

# Open a worktree in a fresh vs code window
flo tr open|o [branch]
```

## Hooks

Now you've come so far and are a regular worktree user, but you realised that you have to install dependencies and copy environment variables everytime you create a new worktree.

Well, we've got you covered here too.

There will be a setup wizard for this in the future, but until then you gotta do it manually:

1. [Create a workflow](#workflows) for what needs to be done in order to prepare a worktree
2. [Setup project scope config](#project-configuration)
3. In there, add a key called `worktreeHooks`
4. Now choose the desired hook and map your `workflowId` to it

(Available hook types include: `onCreate`, `onSwitch`, more coming soon)

# Configuration

```bash
# Print the resolved configuration
flo config

# Edit the global configuration file in vim or vscode.
# There is no flag yet, it just chooses, in case you get vim,
# type `:q!` to exit without saving, or `:qw` to exit with saving.
flo config edit
```

<!-- @TODO: @floydnant implement this
```bash
# Do a semantic validation of the config file (because we only run the syntactic validation on CLI invocation)
flo config validate
```
-->

## Global configuration

Docs WIP - have a look at the [default configuration](./apps/flo-cli/src/assets/default-configs/flo-cli.jsonc) or run the edit command above to take a look at your own.

## Project configuration

<!-- @TODO: @floydnant add a command that does this (`flo config project`) -->

1. Add a top level key in the global config file called `projects`
2. In there, add a key that corresponds to your repository's main worktree's folder name (e.g. for this project it's `floyd-cli`)
3. Now add your project scoped config!

## Local configuration

Coming soon! Use project config until then.

# Workflows

You can setup and run arbitrary scripts with floyd-cli called workflows.
A few example workflows are already available, but of course you'll want to add your own.
There will be a setup wizard for this in the future, but you have to add them manually until then:

1. Run `flo config edit` to edit the config file
2. Look for or create an array called `workflows` on the top level
3. Add your workflow definitions according to [the reference](#workflow-definition-reference)

## Workflow Usage

```bash
flo run <workflowId>
```

Or let them run automatically with [worktree hooks](#hooks).

## Workflow Definition Reference

```json
{
    // A string without spaces, you're calling the workflow with (or for
    // referencing in other places of the config like worktree hooks)
    "workflowId:": "<id>",

    // An optional name and description of the workflow
    "name": "[name]",
    "description": "[description]",

    "steps": [
        // See step definition reference below
    ]
}
```

## Step Definition Reference

```json
{
    // An optional name for the step
    "name": "[the name]",

    ...step // rest of the step, more below
}
```

There are multiple types of steps you can use: [see step types](#copy-file-step)

### Variables

-   @TODO: @floydnant implement tmp overwrite of variables with `--context someVar=value;another=value`
-   @TODO: @floydnant implement input definitions (which get displayed in the --help as options)

Sometimes you don't have the appropriate values available at compile time, so you can use `$`-prefixed identifiers in your steps for interpolating variables at runtime.

-   `$repoRoot` - directory of the repository's main worktree
-   `$worktreeRoot` - directory of the currently active worktree
-   `$newWorktreeRoot` - directory of a new worktree that is being created (when creating a new worktree), will be the current one otherwise
-   `$configRoot` - directory of the global config folder
-   There are more, run `flo config` to see the full list of available variables and their current values.

### Copy File Step

Only supports files for now.

```json
{
    "copyFrom": "<path>",
    "to": "<path>"
}
```

### Command Step

```json
{
    "command": "<command>",

    // An optional directory to run the command from
    // will use the cwd of the caller if not specified
    "cwd": "[path]"
}
```

### Workflow Step

```json
{
    // The ID of another workflow to run as a step
    "workflowId": "<workflowId>",

    // An optional directory to run the workflow from
    // will use the cwd of the caller or the workflow if not specified
    "cwd": "[path]"
}
```

### NPM Step - Coming soon!

Manipulate the `package.json`:

-   Add/Remove scripts
-   Increment the version
-   Actually that'll be it, do you have more ideas? Hit me up!

# TODO

## Docs

-   [ ] Document workflows properly
-   [ ] Document config properly
-   [ ] Create a $schema for the config file

## Features

-   [ ] Improve workflow logs
-   [ ] Implement ability to branch off of another branch than the current one
-   [ ] Implement worktree hook setup wizard
-   [ ] Implement config file migrations

## Internal

-   [ ] Refactor stuff to singleton classes
    -   [ ] `git.repo`

## Rough ideas

-   [x] git worktrees
-   [ ] http server
-   [ ] Open projects from anywhere
    -   Project root path defined in the global config
    -   `flo project|p open|o [projectId]` - `if (project has more than one worktree)` summons a prompt to open a worktree from that project; `else` open the default worktree
-   [ ] Playgrounds -> take inspration from joshua morony's playground script
-   [ ] Predefined workflows (scaffolders)
    -   [ ] Prettier
    -   [ ] Typescript
    -   [ ] eslint
-   [ ] Maybe some ci runs specific stuff (for handling runs that arent triggered by a PR)
-   [ ] PRs
    -   [x] Checks
    -   [ ] Opening `gh pr create` ...
    -   [ ] Merging `gh pr merge --auto --squash --delete-branch <number>`
