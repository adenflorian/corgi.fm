import {exception} from 'react-ga'

export function eventClientServerVersionMismatch(clientVersion: string, serverVersion: string) {
	eventError({
		description: 'ClientServerVersionMismatch',
		fatal: false,
	})
}

export function eventError(arg: EventErrorArg) {
	exception(arg)
}

interface EventErrorArg {
	description: string
	fatal: boolean
}
