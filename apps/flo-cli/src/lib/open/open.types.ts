import { ConfigService } from '../config/config.service'
import { SysCallService } from '../sys-call.service'
import { Installed } from '../installed.interface'

// @TODO: refactor this to use `supportedTypes` instead of `isXyzSupported` properties
export interface OpenPort extends Installed {
    open(url: string, options?: { reuseWindow?: boolean }): boolean
    name: string
    isReuseWindowSupported: boolean
    isFilesSupported: boolean
    isFoldersSupported: boolean
    isUrlsSupported: boolean
}

export type OpenServiceConstructor = new (
    sysCallService: SysCallService,
    configService: ConfigService,
) => OpenPort

export enum OpenType {
    Url = 'url',
    File = 'file',
    Folder = 'folder',
}
