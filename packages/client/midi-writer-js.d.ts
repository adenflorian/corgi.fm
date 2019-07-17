declare module 'midi-writer-js' {
	export class Track {
		public addEvent: (event: IMidiWriterEvent, mapFunction?: any) => any
		public setTempo: (tempo: number) => any
		public addText: (text: string) => any
		public addCopyright: (text: string) => any
		public addTrackName: (text: string) => any
		public addInstrumentName: (text: string) => any
		public addMarker: (text: string) => any
		public addCuePoint: (text: string) => any
		public addLyric: (text: string) => any
		public setTimeSignature: (numerator: number, denominator: number) => any
	}

	export interface IMidiWriterEvent {

	}

	export class NoteEvent {
		public constructor(args: INoteEventOptions)
	}

	export interface INoteEventOptions {
		pitch: string[] | number[]
		duration: string
		wait: string
	}

	export class Writer {
		public dataUri: () => any

		public constructor(tracks: Track[])
	}

	export type mapFunction = (event: Track, index: number) => any
}
