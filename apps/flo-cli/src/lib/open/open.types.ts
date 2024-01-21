import { ConfigService } from '../config/config.service'
import { SysCallService } from '../sys-call.service'
import { Installed } from '../installed.interface'
import { ReuseWindowOptionArg, WaitForCloseOptionArg } from '../../cli/shared.options'

// @TODO: We need to account for different operating systems

export interface OpenPort extends Installed {
    open(url: string, options?: Partial<ReuseWindowOptionArg & WaitForCloseOptionArg>): boolean
    name: string
    supportedTypes: OpenType[]
    alwaysReusesWindow: boolean
    alwaysWaitsForClose: boolean

    canReuseWindow: boolean
    reuseWindowSupportedTypes: OpenType[]

    canWaitForClose: boolean
    waitForCloseSupportedTypes: OpenType[]
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
