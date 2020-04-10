export const maxRoomNameLength = 42
export const serverClientId = 'server'
export const localStorageKey = 'redux'

export const MIN_MIDI_NOTE_NUMBER_0 = 0
export const MAX_MIDI_NOTE_NUMBER_127 = 127

export const lobby = 'lobby'
export const expLobby = 'expLobby'
// REST API
export const apiResourcePathName = 'api'
export const usersResourcePathName = 'users'
export const countResourcePathName = 'count'
export const ContentTypeName = 'Content-Type'

export enum ContentType {
	ApplicationJson = 'application/json',
	TextHtml = 'text/html'
}

export const maxSampleUploadFileSizeMB = 10
export const allowedSampleUploadFileTypes: readonly string[] = [
	'audio/wav',
	'audio/mp3',
]
export const allowedSampleUploadFileExtensions: readonly string[] =
	allowedSampleUploadFileTypes.map(x => x.replace(/^.*\//, ''))

export const defaultS3BucketName = 'cdn-test-corgi-fm'

export const maxTotalSingleUserUploadBytes = 100 * 1000 * 1000

export const defaultSamplePlaybackRate = 1

export const panelHeaderHeight = 24

export const Key = {
	ArrowUp: 'ArrowUp',
	ArrowRight: 'ArrowRight',
	ArrowDown: 'ArrowDown',
	ArrowLeft: 'ArrowLeft',
	Delete: 'Delete',
	Backspace: 'Backspace',
	a: 'a',
	d: 'd',
	Control: 'Control',
} as const

export const maxPitchFrequency = 20000

export const topGroupId = 'top'
export type GroupId = Id | typeof topGroupId

export const expBetterSequencerMainPatternParamId = 'mainPattern'
export const expKeyboardStateParamId = 'keyboardState'

export const expAttackMax = 32
export const expHoldMax = 32
export const expDecayMax = 32
export const expSustainMax = 1
export const expReleaseMax = 32

export const expAttackCurve = 3
export const expHoldCurve = 3
export const expDecayCurve = 3
export const expSustainCurve = 1
export const expReleaseCurve = 3
