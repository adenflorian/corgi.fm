export interface IConnectable {
	readonly id: Id
	readonly type: ConnectionNodeType
	readonly inputPortCount?: number
	readonly outputPortCount?: number
}

export type IMultiStateThingDeserializer = (state: IConnectable) => IConnectable

export enum ConnectionNodeType {
	betterSequencer = 'betterSequencer',
	virtualKeyboard = 'virtualKeyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
	groupSequencer = 'groupSequencer',
	basicSynthesizer = 'basicSynthesizer',
	basicSampler = 'basicSampler',
	audioOutput = 'audioOutput',
	masterClock = 'masterClock',
	dummy = 'dummy',
	simpleReverb = 'simpleReverb',
	simpleCompressor = 'simpleCompressor',
	simpleDelay = 'simpleDelay',
}

export function isSequencerNodeType(type: ConnectionNodeType) {
	return [
		ConnectionNodeType.betterSequencer,
		ConnectionNodeType.gridSequencer,
		ConnectionNodeType.infiniteSequencer,
	].includes(type)
}

export enum Header {
	AccessControlAllowOrigin = 'access-control-allow-origin',
	ContentType = 'content-type',
	Origin = 'origin',
	Authorization = 'authorization',
	CacheControl = 'cache-control',
}

export type Headers = {
	[P in Header]?: string
}

export type IVirtualMidiKeyboard = IVirtualMidiKey[]

export interface IVirtualMidiKey {
	color: KeyColor
	keyName: string
	name: NoteNameSharps
}

export type NoteNameSharps = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

export type NoteNameFlats = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B'

export type KeyColor = 'white' | 'black'

export interface IKeyColors {
	readonly [key: number]: {
		readonly color: KeyColor
		readonly name: NoteNameSharps
	}
}

export const signalRangeOptions = ['unipolar', 'bipolar'] as const
export type SignalRange = typeof signalRangeOptions[number]

export const paramInputCenteringOptions = ['center', 'offset'] as const
export type ParamInputCentering = typeof paramInputCenteringOptions[number]

export const midiActions = {
	gate: (time: number, gate: boolean, voice: number | 'all' = 'all') => ({
		type: 'MIDI_GATE' as const,
		time,
		gate,
		voice,
	} as const),
	note: (time: number, gate: boolean, note: number, velocity: number, voice: number | 'all' = 'all') => ({
		type: 'MIDI_NOTE' as const,
		time,
		gate,
		note,
		velocity,
		voice,
	} as const),
	voiceCountChange: (time: number, newCount: number) => ({
		type: 'VOICE_COUNT_CHANGE' as const,
		time,
		newCount,
	} as const),
	message: (time: number, message: string) => ({
		type: 'MESSAGE' as const,
		time,
		message,
	} as const),
} as const

export type MidiAction = ReturnType<typeof midiActions[keyof typeof midiActions]>

export type GateMidiAction = ReturnType<typeof midiActions['gate']>
export type NoteMidiAction = ReturnType<typeof midiActions['note']>
export type VoiceCountChangeMidiAction = ReturnType<typeof midiActions['voiceCountChange']>
export type MessageMidiAction = ReturnType<typeof midiActions['message']>

export enum RoomType {
	Normal = 'Normal',
	Experimental = 'Experimental',
	Dummy = 'Dummy'
}

export interface ImpulseBuildRequest {
	readonly id: Id
	readonly sampleRate: number
	readonly time: number
	readonly decay: number
	readonly reverse: boolean
}

export interface ImpulseBuilderResponse {
	readonly id: Id
	readonly left: Float32Array
	readonly right: Float32Array
}
