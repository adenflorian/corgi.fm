export function pickRandomArrayElement<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)]
}

export function toArray(object) {
	return Object.keys(object).map(x => object[x])
}

export const isProd = () => process.env.NODE_ENV === 'production'
