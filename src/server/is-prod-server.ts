import {logger} from '../common/logger'

export const isProdServer = () => process.env.NODE_ENV === 'production'

export const isLocalDevServer = () => process.env.NODE_ENV === 'development'

export function logServerEnv() {
	logger.log(
		isProdServer()
			? 'isProd'
			: isLocalDevServer()
				? 'isLocalDev'
				: 'unknown env',
	)
}
