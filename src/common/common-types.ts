export type ClientId = string

export interface IDisposable {
	dispose: () => void
}

export interface Point {
	x: number
	y: number
}

export interface IConnectable {
	id: string
	color: string | false
	type: ConnectionNodeType
}

export enum ConnectionNodeType {
	keyboard = 'keyboard',
	gridSequencer = 'gridSequencer',
	infiniteSequencer = 'infiniteSequencer',
	instrument = 'instrument',
	sampler = 'sampler',
	audioOutput = 'audioOutput',
	masterClock = 'masterClock',
	dummy = 'dummy',
}
