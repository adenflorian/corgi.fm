import {logger} from '../common/logger'

export const isProdClient = () => window.location.hostname.toLowerCase() === 'shamu.adenflorian.com'

export const isTestClient = () => window.location.hostname.toLowerCase() === 'shamu-test.adenflorian.com'

export const isLocalDevClient = () => window.location.hostname.toLowerCase() === 'localhost'

export function logClientEnv() {
	logger.log(
		isProdClient()
			? 'isProd'
			: isTestClient()
				? 'isTest'
				: isLocalDevClient()
					? 'isLocalDevClient'
					: 'unknown env',
	)
}

export const isNewNoteScannerEnabled = () => window.location.pathname.replace('/', '') === 'scan'
