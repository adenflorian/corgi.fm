export function pickRandomArrayElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)]
}

export function toArray(obj: any) {
	return Object.keys(obj).map(x => obj[x])
}
