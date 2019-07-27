import {Config, firebaseCommonConfigs} from '@corgifm/common/firebase-common-config'
import {isLocalDevClient, isTestClient} from '../is-prod-client'

export function getFirebaseConfig() {
	return isLocalDevClient()
		? firebaseConfigs.local
		: isTestClient()
			? firebaseConfigs.test
			: firebaseConfigs.prod
}

/* cspell: disable */
// Not secret, since it goes in the client
const firebaseConfigs: Config = {
	local: {
		...firebaseCommonConfigs.local,
		apiKey: 'AIzaSyCUD_bWy7rLMjGOlKXsEBcmzv8di_1eeE0',
		authDomain: 'corgifm-local.firebaseapp.com',
		databaseURL: 'https://corgifm-local.firebaseio.com',
		storageBucket: '',
		messagingSenderId: '398865688843',
		appId: '1:398865688843:web:da43e4e553f6e89f',
	},
	test: {
		...firebaseCommonConfigs.test,
		apiKey: 'AIzaSyCLqY3wnLvPC1Q9bSUw18GeAc_wqZzZA4g',
		authDomain: 'corgifm-test.firebaseapp.com',
		databaseURL: 'https://corgifm-test.firebaseio.com',
		storageBucket: '',
		messagingSenderId: '316200587752',
		appId: '1:316200587752:web:e4e5db480f1ceb92',
	},
	prod: {
		...firebaseCommonConfigs.prod,
		apiKey: 'AIzaSyDPQiUmiYTcujDSH4f1Tt5yg1wPe9hkrM8',
		authDomain: 'corgifm-prod.firebaseapp.com',
		databaseURL: 'https://corgifm-prod.firebaseio.com',
		storageBucket: '',
		messagingSenderId: '207222452770',
		appId: '1:207222452770:web:c38a74da6be96572',
	},
}
/* cspell: enable */
