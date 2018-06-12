export function isProd() {
	return process.env.SHAMU_ENV === 'production'
}
