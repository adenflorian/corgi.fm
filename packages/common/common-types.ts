import {List} from 'immutable'

export interface IConnectable {
	readonly id: Id
	readonly color: string | false | List<string>
	readonly type: ConnectionNodeType
	readonly inputPortCount?: number
	readonly outputPortCount?: number
}

export interface IMultiStateThing extends IConnectable {
	readonly ownerId: Id
}

export type IMultiStateThingDeserializer = (state: IMultiStateThing) => IMultiStateThing

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

export type ThenArg<T> = T extends Promise<infer U>
	? U
	: T extends (...args: any[]) => Promise<infer V>
		? V
		: T

export type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type AnyFunction = (...args: any[]) => any

export type Octave = number

export type RequiredField<T, K extends keyof T> = {
	[P in K]-?: T[P];
} & T

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
