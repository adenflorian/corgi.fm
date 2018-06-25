export function pickRandomArrayElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)]
}
