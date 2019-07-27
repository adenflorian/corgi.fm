import {Config, firebaseCommonConfigs} from '@corgifm/common/firebase-common-config'
import {isLocalDevServer, isTestServer} from './is-prod-server'

export function getFirebaseServerConfig() {
	return isLocalDevServer()
		? firebaseConfigs.local
		: isTestServer()
			? firebaseConfigs.test
			: firebaseConfigs.prod
}

/* cspell: disable */
// Not secret, since it goes in the client
const firebaseConfigs: Config = {
	local: {
		...firebaseCommonConfigs.local,
	},
	test: {
		...firebaseCommonConfigs.test,
	},
	prod: {
		...firebaseCommonConfigs.prod,
	},
}
/* cspell: enable */
