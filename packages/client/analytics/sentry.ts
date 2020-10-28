import * as Sentry from '@sentry/browser'
import {CaptureConsole} from '@sentry/integrations'
import {logger} from '@corgifm/common/logger'
import {getCurrentClientVersion} from '../client-utils'
import {getEnvName, isLocalDevClient} from '../is-prod-client'

export function initSentry() {
	if (isLocalDevClient()) return

	Sentry.init({
		dsn: 'https://73650ad5e74c46409f94ee95abeb07ec@sentry.io/1503205',
		environment: getEnvName(),
		release: getCurrentClientVersion(),
		integrations: [
			new CaptureConsole({
				levels: ['error', 'warn'],
			}),
		],
	})
	logger.log('sentry client initialized')
}
