import { SysCallService } from '../sys-call.service'
import { InstalledCommandPort } from './open.service'

export interface OpenPort extends InstalledCommandPort {
    open(url: string, options?: { reuseWindow?: boolean }): boolean
    name: OpenType
    isReuseWindowSupported: boolean
    isFilesSupported: boolean
    isFoldersSupported: boolean
    isUrlsSupported: boolean
}

export type OpenServiceConstructor = new (sysCallService: SysCallService) => OpenPort

export enum OpenType {
    Vscode = 'vscode',
    Neovim = 'neovim',
    Vim = 'vim',
    Nano = 'nano',
    Iterm = 'iterm',
    Default = 'default app',
}
