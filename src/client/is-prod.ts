import queryString from 'query-string'

export function isProd() {
	const query = queryString.parse(window.location.search)
	console.log(' query.prod: ', query.prod)
	return window.location.host === 'shamu.adenflorian.com' || query.prod === null
}
