import {debounce} from 'lodash'
import {Map} from 'immutable'

import uuid = require('uuid')

export function pickRandomArrayElement<T>(array: T[]): T {
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
