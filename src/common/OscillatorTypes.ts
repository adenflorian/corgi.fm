import {List} from 'immutable'

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

export enum LfoOscillatorType {
	sine = 'sine',
	square = 'square',
	sawtooth = 'sawtooth',
	reverseSawtooth = 'reverseSawtooth',
	triangle = 'triangle',
}

export enum BuiltInBQFilterType {
	lowpass = 'lowpass',
	highpass = 'highpass',
	bandpass = 'bandpass',
	lowshelf = 'lowshelf',
	highshelf = 'highshelf',
	peaking = 'peaking',
	notch = 'notch',
	allpass = 'allpass',
}

export const allBuiltInBQFilterTypes = List([
	BuiltInBQFilterType.lowpass,
	BuiltInBQFilterType.highpass,
	BuiltInBQFilterType.bandpass,
	BuiltInBQFilterType.lowshelf,
	BuiltInBQFilterType.highshelf,
	BuiltInBQFilterType.peaking,
	BuiltInBQFilterType.notch,
	BuiltInBQFilterType.allpass,
])
