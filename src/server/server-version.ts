import {serverInfo} from './server-info'

export function getServerVersion(): string {
	if (isServerInfo(serverInfo)) {
		return serverInfo.version
	} else {
		throw new Error('failed to load server version from serverInfo')
	}
}

function isServerInfo(arg: any): arg is ServerInfo {
	return arg && arg.version && typeof arg.version === 'string'
}

interface ServerInfo {
	version: string
}
