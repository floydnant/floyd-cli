import { ConfigService } from '../config/config.service'
import { SysCallService } from '../sys-call.service'
import { Installed } from '../installed.interface'

// @TODO: We need to account for different operating systems

export interface OpenPort extends Installed {
    open(url: string, options?: { reuseWindow?: boolean }): boolean
    name: string
    isReuseWindowSupported: boolean
    supportedTypes: OpenType[]
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
