import {debounce} from 'lodash'

import uuid = require('uuid')

export function pickRandomArrayElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)]
}

export function toArray(obj: any) {
	return Object.keys(obj).map(x => obj[x])
}

export function getKeyByValue(object: any, value: any) {
	return Object.keys(object).find(key => object[key] === value)
}

export function assertArrayHasNoUndefinedElements(array: any[]): void {
	array.forEach(x => {
		if (x === undefined) {
			throw new Error('assertArrayHasNoUndefinedElements failed: ' + JSON.stringify(array))
		}
	})
}

export const createThisShouldntHappenError = () => new Error(`this shouldn't happen`)

export const rateLimitedDebounce = <T extends (...args: any[]) => any>(
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

export const rateLimitedDebounceNoTrail = <T extends (...args: any[]) => any>(
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
