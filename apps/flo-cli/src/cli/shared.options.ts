import { createOption } from 'commander'

/** `-a, --app [app]` */
export const appOption = createOption(
    '-a, --app [app]',
    'The app to use instead of the configured one when opening paths. If [app] is not given, will prompt to select an app.',
)
export type AppOptionArg = {
    /**
     * If `app` is specified, it will be preferred over the default app
     * If `app` is `true`, will prompt the user to select an app
     */
    app?: string | true
}

/** `-r,  --reuse-window` */
export const reuseWindowOption = createOption(
    '-r, --reuse-window',
    'Reuse existing window - if supported',
).default(false)
export type ReuseWindowOptionArg = { reuseWindow: boolean }

/** `-w,  --wait-for-close` */
export const waitForCloseOption = createOption(
    '-w, --wait-for-close',
    'Wait for the app to close before continuing - if supported',
).default(false)
export type WaitForCloseOptionArg = { waitForClose: boolean }
