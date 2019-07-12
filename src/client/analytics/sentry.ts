import * as Sentry from '@sentry/browser'
import {CaptureConsole} from '@sentry/integrations'
import {getCurrentClientVersion} from '../client-utils'
import {getEnvName} from '../is-prod-client'

export function initSentry() {
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
}
