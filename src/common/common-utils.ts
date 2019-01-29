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
