import {CaptureConsole} from '@sentry/integrations'
import * as Sentry from '@sentry/node'
import {logger} from '@corgifm/common/logger'
import {getServerEnv, isLocalDevServer} from '../is-prod-server'
import {getServerVersion} from '../server-version'

export function initSentryServer() {
	if (isLocalDevServer()) return

	Sentry.init({
		dsn: 'https://d77fcdf08cbd45ed94c18654789ee353@sentry.io/1503214',
		release: getServerVersion(),
		environment: getServerEnv(),
		integrations: [
			new CaptureConsole({
				levels: ['error', 'warn'],
			}),
		],
	})
	logger.log('sentry server initialized')
}
