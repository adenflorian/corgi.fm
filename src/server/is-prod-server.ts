import {logger} from '../common/logger'

export const isProdServer = () => process.env.NODE_ENV === 'production'

export const isLocalDevServer = () => ['test', 'development'].includes(process.env.NODE_ENV || '')

export function logServerEnv() {
	logger.log(
		isProdServer()
			? 'isProd'
			: isLocalDevServer()
				? 'isLocalDev'
				: 'unknown env',
	)
}
