import {logger} from '@corgifm/common/logger'

export const isProdServer = () =>
	process.env.CORGI_ENV === 'prod'

export const isTestServer = () =>
	process.env.CORGI_ENV === 'test'

export const isLocalDevServer = () =>
	(process.env.CORGI_ENV === 'local')
	||
	(process.env.CORGI_ENV === undefined
		&& process.env.NODE_ENV !== 'production')

export function logServerEnv() {
	logger.log(
		isLocalDevServer()
			? 'isLocalDev'
			: isTestServer()
				? 'isTest'
				: 'isProd',
	)
}

export function getServerEnv() {
	return isLocalDevServer()
		? 'dev'
		: isTestServer()
			? 'test'
			: 'prod'
}
