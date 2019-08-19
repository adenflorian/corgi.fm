export const maxRoomNameLength = 42
export const serverClientId = 'server'
export const localStorageKey = 'redux'

export const MIN_MIDI_NOTE_NUMBER_0 = 0
export const MAX_MIDI_NOTE_NUMBER_127 = 127

export const lobby = 'lobby'
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
} as const
