export type ShamuOscillatorType = BuiltInOscillatorType | CustomOscillatorType.noise

export enum BuiltInOscillatorType {
	sine = 'sine',
	square = 'square',
	sawtooth = 'sawtooth',
	triangle = 'triangle',
}

export enum CustomOscillatorType {
	noise = 'noise',
}
