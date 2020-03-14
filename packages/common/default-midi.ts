import * as Immutable from 'immutable'
import * as uuid from 'uuid'
import {SeqNoteEvent, makeNoteEvent, SeqEvent, SeqSessionClip, SeqPattern, SeqPatternView} from './SeqStuff'
import {arrayToESIdKeyMap} from './common-utils'

export const eventsA: readonly SeqNoteEvent[] = [
	makeNoteEvent('D', 3, 0, 3),
	makeNoteEvent('E', 3, 3, 3),
	makeNoteEvent('F', 3, 6, 3),
	makeNoteEvent('E', 3, 9, 3),

	makeNoteEvent('Bb', 3, 12, 3),
	makeNoteEvent('F', 3, 15, 3),
	makeNoteEvent('Bb', 3, 18, 3),
	makeNoteEvent('A', 3, 21, 3),

	makeNoteEvent('D', 3, 24, 3),
	makeNoteEvent('E', 3, 27, 3),
	makeNoteEvent('F', 3, 30, 3),
	makeNoteEvent('E', 3, 33, 3),

	makeNoteEvent('Bb', 3, 36, 3),
	makeNoteEvent('A', 3, 39, 3),

	makeNoteEvent('D', 3, 42, 3),
	makeNoteEvent('E', 3, 45, 3),
	makeNoteEvent('F', 3, 48, 3),
	makeNoteEvent('E', 3, 51, 3),

	makeNoteEvent('D', 3, 54, 3),
	makeNoteEvent('E', 3, 57, 3),
	makeNoteEvent('F', 3, 60, 3),
	makeNoteEvent('E', 3, 63, 3),
]

export const eventsB: readonly SeqNoteEvent[] = [
	makeNoteEvent('A', 4, 1, 1),
	makeNoteEvent('A', 4, 2, 1),
	makeNoteEvent('B', 4, 4, 2),
	makeNoteEvent('C', 5, 7, 1),
	makeNoteEvent('C', 5, 8, 1),
	makeNoteEvent('B', 4, 10, 2),

	makeNoteEvent('A', 4, 13, 1),
	makeNoteEvent('A', 4, 14, 1),
	makeNoteEvent('A', 4, 16, 2),
	makeNoteEvent('A', 4, 19, 1),
	makeNoteEvent('A', 4, 20, 1),
	makeNoteEvent('A', 4, 22, 2),

	makeNoteEvent('A', 4, 25, 1),
	makeNoteEvent('A', 4, 26, 1),
	makeNoteEvent('B', 4, 28, 2),
	makeNoteEvent('C', 5, 31, 1),
	makeNoteEvent('C', 5, 32, 1),
	makeNoteEvent('B', 4, 34, 2),

	makeNoteEvent('A', 4, 37, 1),
	makeNoteEvent('A', 4, 38, 1),
	makeNoteEvent('A', 4, 40, 2),

	makeNoteEvent('A', 4, 43, 1),
	makeNoteEvent('A', 4, 44, 1),
	makeNoteEvent('B', 4, 46, 2),
	makeNoteEvent('C', 5, 49, 1),
	makeNoteEvent('C', 5, 50, 1),
	makeNoteEvent('B', 4, 52, 2),

	makeNoteEvent('A', 4, 55, 1),
	makeNoteEvent('A', 4, 56, 1),
	makeNoteEvent('B', 4, 58, 2),
	makeNoteEvent('C', 5, 61, 1),
	makeNoteEvent('C', 5, 62, 1),
	makeNoteEvent('B', 4, 64, 2),
]



export const eventsC: readonly SeqNoteEvent[] = [
	makeNoteEvent('D', 5, 0, 0.5),
	makeNoteEvent('F', 5, 0.5, 0.5),
	makeNoteEvent('D', 6, 1, 2),
	makeNoteEvent('D', 5, 3, 0.5),
	makeNoteEvent('F', 5, 3.5, 0.5),
	makeNoteEvent('D', 6, 4, 2),

	makeNoteEvent('E', 6, 6, 1.5),
	makeNoteEvent('F', 6, 7.5, 0.5),
	makeNoteEvent('E', 6, 8, 0.5),
	makeNoteEvent('F', 6, 8.5, 0.5),
	makeNoteEvent('E', 6, 9, 0.5),
	makeNoteEvent('C', 6, 9.5, 0.5),
	makeNoteEvent('A', 5, 10, 2),

	makeNoteEvent('A', 5, 12, 1),
	makeNoteEvent('D', 5, 13, 1),
	makeNoteEvent('F', 5, 14, 0.5),
	makeNoteEvent('G', 5, 14.5, 0.5),
	makeNoteEvent('A', 5, 15, 3),

	makeNoteEvent('A', 5, 18, 1),
	makeNoteEvent('D', 5, 19, 1),
	makeNoteEvent('F', 5, 20, 0.5),
	makeNoteEvent('G', 5, 20.5, 0.5),
	makeNoteEvent('E', 5, 21, 3),


	makeNoteEvent('D', 5, 24, 0.5),
	makeNoteEvent('F', 5, 24.5, 0.5),
	makeNoteEvent('D', 6, 25, 2),
	makeNoteEvent('D', 5, 27, 0.5),
	makeNoteEvent('F', 5, 27.5, 0.5),
	makeNoteEvent('D', 6, 28, 2),

	makeNoteEvent('E', 6, 30, 1.5),
	makeNoteEvent('F', 6, 31.5, 0.5),
	makeNoteEvent('E', 6, 32, 0.5),
	makeNoteEvent('F', 6, 32.5, 0.5),
	makeNoteEvent('E', 6, 33, 0.5),
	makeNoteEvent('C', 6, 33.5, 0.5),
	makeNoteEvent('A', 5, 34, 2),

	makeNoteEvent('A', 5, 36, 1),
	makeNoteEvent('D', 5, 37, 1),
	makeNoteEvent('F', 5, 38, 0.5),
	makeNoteEvent('G', 5, 38.5, 0.5),
	makeNoteEvent('A', 5, 39, 3),

	makeNoteEvent('A', 5, 41, 1),
	makeNoteEvent('D', 5, 42, 3),
]

export const patternA = (): SeqPattern => ({
	id: uuid.v4(),
	events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(eventsA)),
	name: 'Pattern A',
})

export const patternB = (): SeqPattern => ({
	id: uuid.v4(),
	events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(eventsB)),
	name: 'Pattern B',
})

export const patternC = (): SeqPattern => ({
	id: uuid.v4(),
	events: Immutable.Map<Id, SeqEvent>(arrayToESIdKeyMap(eventsC)),
	name: 'Pattern C',
})

export const patternViewA = (): SeqPatternView => ({
	id: uuid.v4(),
	startBeat: 0,
	endBeat: 66,
	loopStartBeat: 0,
	loopEndBeat: 66,
	pattern: patternA(),
	name: 'Pattern View A',
})

export const patternViewB = (): SeqPatternView => ({
	id: uuid.v4(),
	startBeat: 0,
	endBeat: 66,
	loopStartBeat: 0,
	loopEndBeat: 66,
	pattern: patternB(),
	name: 'Pattern View B',
})

export const patternViewC = (): SeqPatternView => ({
	id: uuid.v4(),
	startBeat: 0,
	endBeat: 66,
	loopStartBeat: 0,
	loopEndBeat: 66,
	pattern: patternC(),
	name: 'Pattern View C',
})

const sessionClipA = (): SeqSessionClip => ({
	id: uuid.v4(),
	active: true,
	channelId: uuid.v4(),
	sceneId: uuid.v4(),
	launchMode: 'trigger',
	patternView: patternViewA(),
	name: 'Session Clip A',
})

const sessionClipB = (): SeqSessionClip => ({
	id: uuid.v4(),
	active: true,
	channelId: uuid.v4(),
	sceneId: uuid.v4(),
	launchMode: 'trigger',
	patternView: patternViewB(),
	name: 'Session Clip B',
})

const sessionClipC = (): SeqSessionClip => ({
	id: uuid.v4(),
	active: true,
	channelId: uuid.v4(),
	sceneId: uuid.v4(),
	launchMode: 'trigger',
	patternView: patternViewC(),
	name: 'Session Clip C',
})

// this._session = {
// 	id: uuid.v4(),
// 	sessionClips: Immutable.Set([sessionClipA, sessionClipB, sessionClipC]),
// 	name: 'The Session',
// }