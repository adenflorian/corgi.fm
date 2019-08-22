import * as path from 'path'
import {debounce} from 'lodash'
import {Map} from 'immutable'
import {allowedSampleUploadFileExtensions} from './common-constants'
import {MidiClipEvents} from './midi-types'

import uuid = require('uuid')

export function pickRandomArrayElement<T>(array: readonly T[]): T {
	return array[Math.floor(Math.random() * array.length)]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getKeyByValue(object: any, value: unknown) {
	return Object.keys(object).find(key => object[key] === value)
}

export function assertArrayHasNoUndefinedElements(array: unknown[]): void {
	array.forEach(x => {
		if (x === undefined) {
			throw new Error('assertArrayHasNoUndefinedElements failed: ' + JSON.stringify(array))
		}
	})
}

export const createThisShouldntHappenError = () => new Error(`this shouldn't happen`)

export const rateLimitedDebounce = <T extends (...args: any[]) => unknown>(
	func: T,
	intervalMs: number,
) => debounce(
	func,
	intervalMs,
	{
		leading: true,
		trailing: true,
		maxWait: intervalMs,
	},
)

export const rateLimitedDebounceNoTrail = <T extends (...args: unknown[]) => unknown>(
	func: T,
	intervalMs: number,
) => debounce(
	func,
	intervalMs,
	{
		leading: true,
		trailing: false,
		maxWait: intervalMs,
	},
)

/** Returns a number from 0 to length - 1 */
export function getNumberInRangeFromString(str: string, length: number) {
	return str
		.split('')
		.reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
		% length
}

export function createNodeId() {
	return uuid.v4()
}

export const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

export const incrementalRound = (v: number, increment: number) => Math.round(v / increment) * increment

export function applyOctave(midiNumber: number, octave: number) {
	if (octave === -1) return midiNumber

	return midiNumber + (octave * 12) + 12
}

export function removeOctave(midiNumber: number) {
	return midiNumber % 12
}

// eslint-disable-next-line no-empty-function
export const noop = () => {}

// https://stackoverflow.com/a/30835667
export function multilineRegExp(regExps: RegExp[], flags?: string) {
	return new RegExp(
		regExps.map(reg => reg.source).join(''),
		flags
	)
}

export function convertToNumberKeyMap<T>(obj: Map<string, T>): Map<number, T> {
	return obj.reduce((result, value, key) => {
		return result.set(Number.parseInt(key), value)
	}, Map<number, T>())
}

export function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

/** Megabytes to bytes */
export function MBtoBytes(MB: number) {
	return MB * 1000 * 1000
}

/** Bytes to megabytes */
export function bytesToMB(bytes: number) {
	return bytes / 1000 / 1000
}

export function validateSampleFilenameExtension(filename: string) {
	const extension = path.extname(filename)
	// must have extension
	if (extension === '') {
		return {
			error: 'Filename is missing extension',
			extension,
		}
	}
	// extension must match allowed extensions
	if (!allowedSampleUploadFileExtensions.includes(extension.replace('.', '').toLowerCase())) {
		return {
			error: `Invalid extension (${extension}), must be one of the following: `
				+ JSON.stringify(allowedSampleUploadFileExtensions),
			extension,
		}
	}
	return {extension}
}

export function removeExtension(fileName: string) {
	return fileName.replace(/\.[^/.]+$/, '')
}

export type IKeyToMidiMap = Map<string, number>

export const keyToMidiMap: IKeyToMidiMap = Map<number>({
	'a': 0,
	'w': 1,
	's': 2,
	'e': 3,
	'd': 4,
	'f': 5,
	't': 6,
	'g': 7,
	'y': 8,
	'h': 9,
	'u': 10,
	'j': 11,
	'k': 12,
	'o': 13,
	'l': 14,
	'p': 15,
	';': 16,
})

export const colorRegex = multilineRegExp([
	/^/,
	/(#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|hsl\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%\))/,
	/$/,
])

export function findLowestAndHighestNotes(events: MidiClipEvents) {
	return {
		lowestNote: findLowestNote(events),
		highestNote: findHighestNote(events),
	}
}

export function findLowestNote(events: MidiClipEvents): number {
	let lowest = Number.MAX_VALUE

	events.forEach(event => {
		if (event.note < lowest) {
			lowest = event.note
		}
	})

	if (lowest === Number.MAX_VALUE) {
		return 0
	}

	return lowest
}

export function findHighestNote(events: MidiClipEvents): number {
	let highest = Number.MIN_VALUE

	events.forEach(event => {
		if (event.note > highest) {
			highest = event.note
		}
	})

	if (highest === Number.MIN_VALUE) {
		return 127
	}

	return highest
}

export function sumPoints(...points: Point[]) {
	return points.reduce(_sumPoints)
}

function _sumPoints(a: Point, b: Point) {
	return {
		x: a.x + b.x,
		y: a.y + b.y,
	}
}
