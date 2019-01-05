declare module 'midi-writer-js' {
	export class Track {
		addEvent: (event: IMidiWriterEvent, mapFunction?: any) => any
		setTempo: (tempo: number) => any
		addText: (text: string) => any
		addCopyright: (text: string) => any
		addTrackName: (text: string) => any
		addInstrumentName: (text: string) => any
		addMarker: (text: string) => any
		addCuePoint: (text: string) => any
		addLyric: (text: string) => any
		setTimeSignature: (numerator: number, denominator: number) => any
	}

	export interface IMidiWriterEvent {

	}

	export class NoteEvent {
		constructor(args: INoteEventOptions)
	}

	export interface INoteEventOptions {
		pitch: string[] | number[]
		duration: string
		wait: string
	}

	export class Writer {
		constructor(tracks: Track[])

		public dataUri: () => any
	}

	export type mapFunction = (event: Track, index: number) => any
}


