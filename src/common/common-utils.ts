import {debounce} from 'lodash'

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

/** Returns a number from 0 to length - 1 */
export function getNumberInRangeFromString(str: string, length: number) {
	return str
		.split('')
		.reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
		% length
}
