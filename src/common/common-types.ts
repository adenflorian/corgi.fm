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
}

export interface IMultiStateThing extends IConnectable {
	id: string
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
}

export function isSequencerNodeType(type: ConnectionNodeType) {
	return [
		ConnectionNodeType.gridSequencer,
		ConnectionNodeType.infiniteSequencer,
	].includes(type)
}
