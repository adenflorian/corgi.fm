import * as uuid from 'uuid'

export function getInitialServerState() {
	return {
		simpleTrack: getInitialSimpleTrack(),
		basicInstruments: {
			instruments: getInitialInstruments(),
		},
	}
}

function getInitialSimpleTrack() {
	return {
		notes: [
			{notes: [1]},
			{notes: [15, 10]},
			{notes: [1]},
			{notes: []},
			{notes: [1, 10]},
			{notes: []},
			{notes: [1]},
			{notes: [10, 15]},
			{notes: [3]},
			{notes: []},
			{notes: [3, 10]},
			{notes: []},
			{notes: [3]},
			{notes: [10]},
			{notes: [18, 3]},
			{notes: []},
		],
	}
}

function getInitialInstruments() {
	const newId = uuid.v4()

	return {
		[newId]: {
			oscillatorType: 'sine' as OscillatorType,
			id: newId,
			ownerId: 'track-1',
		},
	}
}
