import {List} from 'immutable'

export type ClientId = string

export type Id = string

export interface IDisposable {
	dispose: () => void
}

export interface Point {
	x: number
	y: number
}

export interface IConnectable {
	id: string
	color: string | false | List<string>
	type: ConnectionNodeType
	width: number
	height: number
	name: string
	inputPortCount?: number
	outputPortCount?: number
	enabled: boolean
}

export interface IMultiStateThing extends IConnectable {
	ownerId: string
}

export type IMultiStateThingDeserializer = (state: IMultiStateThing) => IMultiStateThing

export enum ConnectionNodeType {
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