import { SysCallService } from '../sys-call.service'
import { InstalledCommandPort } from './open.service'

export interface OpenPort extends InstalledCommandPort {
    open(url: string, options?: { reuseWindow?: boolean }): void
    name: OpenType
    isReuseWindowSupported: boolean
}

export type OpenServiceConstructor = new (sysCallService: SysCallService) => OpenPort

export enum OpenType {
    Vscode = 'vscode',
    Neovim = 'neovim',
    Vim = 'vim',
    Nano = 'nano',
    Default = 'default app',
}
