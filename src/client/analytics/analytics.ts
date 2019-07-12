import {event, exception} from 'react-ga'

export function eventNewRoomButtonClick() {
	event({
		category: 'rooms',
		action: 'clickNewRoomButton',
		label: 'clickNewRoomButton',
	})
}

export function eventSaveRoomToBrowserButtonClick() {
	event({
		category: 'rooms',
		action: 'clickSaveRoomToBrowserButton',
		label: 'clickSaveRoomToBrowserButton',
	})
}

export function eventSaveRoomToFileButtonClick() {
	event({
		category: 'rooms',
		action: 'clickSaveRoomToFileButton',
		label: 'clickSaveRoomToFileButton',
	})
}

export function eventLoadRoomButtonClick() {
	event({
		category: 'rooms',
		action: 'clickLoadRoomButton',
		label: 'clickLoadRoomButton',
	})
}

export function eventPruneRoomButtonClick() {
	event({
		category: 'rooms',
		action: 'clickPruneRoomButton',
		label: 'clickPruneRoomButton',
	})
}

export function eventPruneRoomConfirmed() {
	event({
		category: 'rooms',
		action: 'clickPruneRoomConfirmed',
		label: 'clickPruneRoomConfirmed',
	})
}

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
