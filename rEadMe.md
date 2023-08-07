# Floyd cli

A cli for automating and simplifying common tasks such as

-   Managing git worktrees (creating, displaying, switching, deleting, etc.)
-   Managing pr checks (displaying, rerunning, etc.)
-   Running common tasks as automated scripts
-   More to come...

## Installation

1. Clone the repo
2. Run `npm i` to install dependencies and build the CLI
3. Run `npm i . -g` to make the CLI globally available - may require the good ol' `sudo`

If you make any changes to the source code, just run the npm `build` or `dev` scripts respectively and the updates will be reflected in the bin installation.

## Updates

There is currently no proper update automation in place (on the roadmap), so you have to manually run these commands to get the latest changes:

```bash
cd <folder> # the folder in which you cloned this repo, obviously
git pull
npm i
```

## Usage

Arguments displayed as `[argument]` are optional, the ones displayed as `<argument>` are required.

```bash
flo help # for available commands
flo help <command> # for help on a command, or flo <command> --help
```

Disclaimer: All commands that are available, but not documented here are WIP.

## Worktrees

You can use these aliases for a quicker typing experience

```bash
flo worktrees|wok|tr <subcomand>
```

You can pass a branch name to the commands for quicker usage or leave it blank for an interactive prompt.
Refer to the `--help` pages for possible options and arguments.

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

## TODO

-   [ ] Create a $schema for the config file
-   [ ] Document workflows properly
-   [ ] Document config properly
-   [ ] Implement worktree hook setup wizard
-   [ ] Implement config file migrations
-   [ ] Refactor stuff to singleton classes
    -   [ ] `git.repo`

### Features

-   [x] git worktrees
-   [ ] http server
-   [ ] Playgrounds (angular, ...) -> take inspration from joshua morony's playground script
-   [ ] More workflow commands
    -   [x] Make more generic
    -   [ ] eslint
    -   [x] Implement workflow runs after worktree creation
-   [ ] Maybe some ci runs specific stuff (for handling runs that arent triggered by a PR)
-   [ ] PRs
    -   [x] Checks
    -   [ ] Opening `gh pr create` ...
    -   [ ] Merging `gh pr merge --auto --squash --delete-branch <number>`
