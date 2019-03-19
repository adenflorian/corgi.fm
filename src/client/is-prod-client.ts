import {logger} from '../common/logger'

export const isProdClient = () => _isProdClient
const _isProdClient = window.location.hostname.toLowerCase() === 'shamu.adenflorian.com'

export const isTestClient = () => _isTestClient
const _isTestClient = window.location.hostname.toLowerCase() === 'shamu-test.adenflorian.com'

export const isLocalDevClient = () => _isLocalDevClient
const _isLocalDevClient = window.location.hostname.toLowerCase() === 'localhost'

export const getEnvDisplayName = () => _getEnvDisplayName
const _getEnvDisplayName = isLocalDevClient()
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

const _getPath = () => window.location.pathname.replace('/', '')

export const isECSEnabled = () => isNewNoteScannerEnabled()

export const isNewNoteScannerEnabled = () => _isNewNoteScannerEnabled
const _isNewNoteScannerEnabled = _getPath() === 'scan'
