import {logger} from '@corgifm/common/logger'

export const isProdClient = () => _isProdClient
const _isProdClient = window.location.hostname.toLowerCase() === 'corgi.fm'

export const isTestClient = () => _isTestClient
const _isTestClient = window.location.hostname.toLowerCase() === 'test.corgi.fm'

export const isLocalDevClient = () => _isLocalDevClient
const _isLocalDevClient = ['localhost', 'local.corgi.fm'].includes(window.location.hostname.toLowerCase())

/** Use for displaying to user */
export const getEnvDisplayName = () => _getEnvDisplayName
const _getEnvDisplayName = isLocalDevClient()
	? 'dev'
	: isTestClient()
		? 'test'
		: 'prod'

/** Use for analytics and error trackers */
export const getEnvName = () => _getEnvName
const _getEnvName = isLocalDevClient()
	? 'dev'
	: isTestClient()
		? 'test'
		: 'prod'

export function logClientEnv() {logger.log(_logClientEnv)}
const _logClientEnv = isProdClient()
	? 'isProd'
	: isTestClient()
		? 'isTest'
		: isLocalDevClient()
			? 'isLocalDevClient'
			: 'unknown env'
