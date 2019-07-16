const isWindowDefined = typeof window !== 'undefined'

export function isClient() {
	return isWindowDefined === true
}

export function isServer() {
	return isWindowDefined === false
}
